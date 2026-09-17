package com.unibus.backend.notice;

import java.sql.Array;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
class NoticeRepository {

    private static final String SELECT_NOTICE = """
        SELECT n.id, n.title, n.content, n.category, n.priority,
               n.is_pinned, n.view_count, n.image_urls, n.content_below,
               n.created_at, n.updated_at, u.id AS author_id, u.name AS author_name
        FROM notices n
        JOIN users u ON u.id = n.author_id
        """;

    private final JdbcTemplate jdbcTemplate;

    NoticeRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    List<NoticeResponse> findAll() {
        return jdbcTemplate.query(
            SELECT_NOTICE + " ORDER BY n.is_pinned DESC, n.created_at DESC",
            (resultSet, rowNumber) -> mapNotice(resultSet)
        );
    }

    Optional<NoticeResponse> findById(UUID id) {
        return jdbcTemplate.query(
            SELECT_NOTICE + " WHERE n.id = ?",
            (resultSet, rowNumber) -> mapNotice(resultSet),
            id
        ).stream().findFirst();
    }

    void incrementViewCount(UUID id, int nextViewCount) {
        jdbcTemplate.update("UPDATE notices SET view_count = ? WHERE id = ?", nextViewCount, id);
    }

    private NoticeResponse mapNotice(java.sql.ResultSet resultSet) throws SQLException {
        Integer viewCount = resultSet.getObject("view_count", Integer.class);
        return new NoticeResponse(
            resultSet.getString("id"),
            resultSet.getString("title"),
            resultSet.getString("content"),
            resultSet.getString("category"),
            resultSet.getString("priority"),
            resultSet.getObject("is_pinned", Boolean.class),
            viewCount,
            resultSet.getString("author_id"),
            resultSet.getString("author_name"),
            toStringList(resultSet.getArray("image_urls")),
            Optional.ofNullable(resultSet.getString("content_below")).orElse(""),
            resultSet.getObject("created_at", OffsetDateTime.class),
            resultSet.getObject("updated_at", OffsetDateTime.class)
        );
    }

    private List<String> toStringList(Array sqlArray) throws SQLException {
        if (sqlArray == null) {
            return List.of();
        }
        try {
            return Arrays.asList((String[]) sqlArray.getArray());
        } finally {
            sqlArray.free();
        }
    }
}
