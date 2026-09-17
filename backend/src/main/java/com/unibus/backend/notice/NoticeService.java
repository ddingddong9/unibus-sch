package com.unibus.backend.notice;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class NoticeService {

    private final NoticeRepository noticeRepository;

    NoticeService(NoticeRepository noticeRepository) {
        this.noticeRepository = noticeRepository;
    }

    @Transactional(readOnly = true)
    List<NoticeResponse> findAll() {
        return noticeRepository.findAll();
    }

    @Transactional
    Optional<NoticeResponse> findByIdAndIncrementViewCount(String rawId) {
        UUID id = parseUuid(rawId);
        if (id == null) {
            return Optional.empty();
        }

        Optional<NoticeResponse> notice = noticeRepository.findById(id);
        if (notice.isEmpty()) {
            return Optional.empty();
        }

        NoticeResponse current = notice.orElseThrow();
        int nextViewCount = Optional.ofNullable(current.viewCount()).orElse(0) + 1;
        noticeRepository.incrementViewCount(id, nextViewCount);
        return Optional.of(new NoticeResponse(
            current.id(), current.title(), current.content(), current.category(), current.priority(),
            current.isPinned(), nextViewCount, current.authorId(), current.authorName(),
            current.imageUrls(), current.contentBelow(), current.createdAt(), current.updatedAt()
        ));
    }

    private UUID parseUuid(String value) {
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }
}
