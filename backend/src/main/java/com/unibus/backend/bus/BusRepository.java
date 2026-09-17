package com.unibus.backend.bus;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
class BusRepository {

    private static final String SELECT_BUS = """
        SELECT b.id, b.name, b.type, b.capacity, b.status, b.is_running,
               r.id AS route_id, r.name AS route_name, r.color AS route_color
        FROM buses b
        LEFT JOIN routes r ON r.id = b.current_route_id
        """;

    private final JdbcTemplate jdbcTemplate;

    BusRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    List<BusResponses.ListItem> findAll() {
        List<BaseBus> buses = jdbcTemplate.query(
            SELECT_BUS + " ORDER BY b.id",
            (resultSet, rowNumber) -> mapBaseBus(resultSet)
        );
        if (buses.isEmpty()) {
            return List.of();
        }

        Map<String, BusResponses.ActiveTrip> trips = jdbcTemplate.query("""
            SELECT id, bus_id, route_id, service_phase, planned_departure_at, current_stop_order
            FROM bus_trips
            WHERE status = 'active'
            """, (resultSet, rowNumber) -> Map.entry(
                resultSet.getString("bus_id"),
                new BusResponses.ActiveTrip(
                    resultSet.getString("id"),
                    resultSet.getString("route_id"),
                    resultSet.getString("service_phase"),
                    resultSet.getObject("planned_departure_at", OffsetDateTime.class),
                    resultSet.getObject("current_stop_order", Integer.class)
                )
            )).stream().collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        Map<String, BusResponses.Location> locations = jdbcTemplate.query("""
            SELECT bus_id, latitude, longitude, speed, heading, timestamp
            FROM bus_latest_state
            """, (resultSet, rowNumber) -> Map.entry(
                resultSet.getString("bus_id"),
                mapLocation(resultSet)
            )).stream().collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        return buses.stream().map(bus -> {
            BusResponses.Location location = locations.get(bus.id());
            return new BusResponses.ListItem(
                bus.id(), bus.name(), bus.type(), bus.capacity(), bus.status(), bus.isRunning(),
                bus.currentRoute(), trips.get(bus.id()), location,
                location == null ? null : location.timestamp()
            );
        }).toList();
    }

    Optional<BusResponses.Detail> findById(String id) {
        return jdbcTemplate.query(
            SELECT_BUS + " WHERE b.id = ?",
            (resultSet, rowNumber) -> mapBaseBus(resultSet),
            id
        ).stream().findFirst().map(bus -> new BusResponses.Detail(
            bus.id(), bus.name(), bus.type(), bus.capacity(), bus.status(), bus.isRunning(),
            bus.currentRoute(), findLatestHistoricalLocation(bus.id()).orElse(null)
        ));
    }

    List<BusResponses.LatestLocation> findLatestLocations() {
        return jdbcTemplate.query("""
            SELECT bus_id, latitude, longitude, speed, heading, timestamp
            FROM bus_latest_state
            """, (resultSet, rowNumber) -> new BusResponses.LatestLocation(
                resultSet.getString("bus_id"),
                number(resultSet, "latitude"),
                number(resultSet, "longitude"),
                number(resultSet, "speed"),
                resultSet.getObject("heading", Integer.class),
                resultSet.getObject("timestamp", OffsetDateTime.class)
            ));
    }

    private Optional<BusResponses.Location> findLatestHistoricalLocation(String busId) {
        return jdbcTemplate.query("""
            SELECT latitude, longitude, speed, heading, timestamp
            FROM bus_locations
            WHERE bus_id = ?
            ORDER BY timestamp DESC
            LIMIT 1
            """, (resultSet, rowNumber) -> mapLocation(resultSet), busId).stream().findFirst();
    }

    private BaseBus mapBaseBus(ResultSet resultSet) throws SQLException {
        String routeId = resultSet.getString("route_id");
        return new BaseBus(
            resultSet.getString("id"),
            resultSet.getString("name"),
            toClientType(resultSet.getString("type")),
            resultSet.getObject("capacity", Integer.class),
            resultSet.getString("status"),
            resultSet.getObject("is_running", Boolean.class),
            routeId == null ? null : new BusResponses.CurrentRoute(
                routeId,
                resultSet.getString("route_name"),
                resultSet.getString("route_color")
            )
        );
    }

    private BusResponses.Location mapLocation(ResultSet resultSet) throws SQLException {
        return new BusResponses.Location(
            number(resultSet, "latitude"),
            number(resultSet, "longitude"),
            number(resultSet, "speed"),
            resultSet.getObject("heading", Integer.class),
            resultSet.getObject("timestamp", OffsetDateTime.class)
        );
    }

    private Double number(ResultSet resultSet, String column) throws SQLException {
        Number value = (Number) resultSet.getObject(column);
        return value == null ? null : value.doubleValue();
    }

    private String toClientType(String type) {
        return switch (type) {
            case "shuttle" -> "campus";
            case "commute" -> "commuter";
            default -> type;
        };
    }

    private record BaseBus(
        String id,
        String name,
        String type,
        Integer capacity,
        String status,
        Boolean isRunning,
        BusResponses.CurrentRoute currentRoute
    ) {
    }
}
