package com.metamuse.repository;

import com.metamuse.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);

    int countByUserIdAndReadFalse(String userId);

    @Modifying @Transactional
    @Query("UPDATE Notification n SET n.read = true WHERE n.userId = :userId")
    void markAllAsRead(String userId);

    @Modifying @Transactional
    @Query("DELETE FROM Notification n WHERE n.userId = :userId AND n.read = true")
    void deleteReadByUserId(String userId);
}
