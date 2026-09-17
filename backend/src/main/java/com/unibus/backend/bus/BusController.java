package com.unibus.backend.bus;

import com.unibus.backend.common.api.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/buses")
public class BusController {

    private static final Logger log = LoggerFactory.getLogger(BusController.class);
    private final BusService busService;

    public BusController(BusService busService) {
        this.busService = busService;
    }

    @GetMapping
    ResponseEntity<ApiResponse<?>> findAll() {
        try {
            return ResponseEntity.ok(ApiResponse.success(busService.findAll()));
        } catch (RuntimeException error) {
            log.error("Failed to fetch buses", error);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to fetch buses"));
        }
    }

    @GetMapping("/{id}")
    ResponseEntity<ApiResponse<?>> findById(@PathVariable String id) {
        try {
            return busService.findById(id)
                .<ResponseEntity<ApiResponse<?>>>map(bus -> ResponseEntity.ok(ApiResponse.success(bus)))
                .orElseGet(() -> ResponseEntity.status(404).body(ApiResponse.error("Bus not found")));
        } catch (RuntimeException error) {
            log.error("Failed to fetch bus", error);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to fetch bus"));
        }
    }

    @GetMapping("/locations/latest")
    ResponseEntity<ApiResponse<?>> findLatestLocations() {
        try {
            return ResponseEntity.ok(ApiResponse.success(busService.findLatestLocations()));
        } catch (RuntimeException error) {
            log.error("Failed to fetch locations", error);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to fetch locations"));
        }
    }
}
