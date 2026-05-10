package com.metamuse.repository;

import com.metamuse.enums.EventStatus;
import com.metamuse.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findByCreatedBy(String createdBy);

    List<Event> findByStatus(EventStatus status);

    List<Event> findByFeaturedTrueAndStatus(EventStatus status);

    @Query("SELECT e FROM Event e WHERE e.startDate >= :today AND e.status = 'PUBLISHED' ORDER BY e.startDate ASC")
    List<Event> findUpcoming(LocalDate today);

    @Query("SELECT e FROM Event e WHERE :today BETWEEN e.startDate AND e.endDate AND e.status IN ('PUBLISHED', 'ONGOING')")
    List<Event> findOngoing(LocalDate today);

    @Query("SELECT e FROM Event e WHERE LOWER(e.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.theme) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Event> search(String keyword);
}
