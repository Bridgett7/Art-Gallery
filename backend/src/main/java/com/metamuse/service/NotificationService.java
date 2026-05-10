package com.metamuse.service;

import com.metamuse.model.Notification;
import com.metamuse.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService implements IService<Notification> {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public Notification add(Notification notification) {
        Notification saved = notificationRepository.save(notification);
        // Push via WebSocket
        messagingTemplate.convertAndSendToUser(
                saved.getUserId(), "/queue/notifications",
                Map.of("id", saved.getId(), "title", saved.getTitle(),
                        "message", saved.getMessage(), "createdAt", saved.getCreatedAt().toString())
        );
        return saved;
    }

    @Override
    @Transactional
    public Notification update(Notification notification) {
        return notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        notificationRepository.deleteById(id);
    }

    @Override
    public Notification findById(Long id) {
        return notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
    }

    @Override
    public List<Notification> getAll() {
        return notificationRepository.findAll();
    }

    // --- Business methods ---

    /**
     * Convenience method to create and push a notification.
     */
    @Transactional
    public Notification create(String userId, String title, String message) {
        Notification notification = Notification.builder()
                .userId(userId).title(title).message(message)
                .build();
        return add(notification);
    }

    public List<Notification> findByUser(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public int getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public void markAllAsRead(String userId) {
        notificationRepository.markAllAsRead(userId);
    }

    @Transactional
    public void clearRead(String userId) {
        notificationRepository.deleteReadByUserId(userId);
    }
}
