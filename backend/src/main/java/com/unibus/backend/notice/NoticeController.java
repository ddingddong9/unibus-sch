package com.unibus.backend.notice;

import com.unibus.backend.common.api.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/notices")
public class NoticeController {

    private static final Logger log = LoggerFactory.getLogger(NoticeController.class);
    private final NoticeService noticeService;

    public NoticeController(NoticeService noticeService) {
        this.noticeService = noticeService;
    }

    @GetMapping
    ResponseEntity<ApiResponse<?>> findAll() {
        try {
            return ResponseEntity.ok(ApiResponse.success(noticeService.findAll()));
        } catch (RuntimeException error) {
            log.error("Failed to fetch notices", error);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to fetch notices"));
        }
    }

    @GetMapping("/{id}")
    ResponseEntity<ApiResponse<?>> findById(@PathVariable String id) {
        try {
            return noticeService.findByIdAndIncrementViewCount(id)
                .<ResponseEntity<ApiResponse<?>>>map(notice -> ResponseEntity.ok(ApiResponse.success(notice)))
                .orElseGet(() -> ResponseEntity.status(404).body(ApiResponse.error("Notice not found")));
        } catch (RuntimeException error) {
            log.error("Failed to fetch notice", error);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to fetch notice"));
        }
    }
}
