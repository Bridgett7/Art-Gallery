package com.metamuse.repository;

import com.metamuse.model.Planning;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PlanningRepository extends JpaRepository<Planning, Long> {
    List<Planning> findByCourseId(Long courseId);
    List<Planning> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);
    List<Planning> findByStatus(String status);
}
