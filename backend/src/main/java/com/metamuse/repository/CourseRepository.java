package com.metamuse.repository;

import com.metamuse.enums.LessonLevel;
import com.metamuse.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByLevel(LessonLevel level);
    List<Course> findByTitleContainingIgnoreCase(String title);
}
