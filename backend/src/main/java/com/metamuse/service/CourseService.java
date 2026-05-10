package com.metamuse.service;

import com.metamuse.enums.LessonLevel;
import com.metamuse.model.Course;
import com.metamuse.model.Lesson;
import com.metamuse.model.Planning;
import com.metamuse.repository.CourseRepository;
import com.metamuse.repository.LessonRepository;
import com.metamuse.repository.PlanningRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseService implements IService<Course> {

    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final PlanningRepository planningRepository;

    @Override
    @Transactional
    public Course add(Course course) {
        return courseRepository.save(course);
    }

    @Override
    @Transactional
    public Course update(Course course) {
        if (!courseRepository.existsById(course.getId())) {
            throw new RuntimeException("Course not found with id: " + course.getId());
        }
        return courseRepository.save(course);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!courseRepository.existsById(id)) {
            throw new RuntimeException("Course not found with id: " + id);
        }
        courseRepository.deleteById(id);
    }

    @Override
    public Course findById(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found with id: " + id));
    }

    @Override
    public List<Course> getAll() {
        return courseRepository.findAll();
    }

    // --- Business methods ---

    public List<Course> search(String query) {
        return courseRepository.findByTitleContainingIgnoreCase(query);
    }

    public List<Course> findByLevel(LessonLevel level) {
        return courseRepository.findByLevel(level);
    }

    // --- Lessons ---

    public List<Lesson> getLessons(Long courseId) {
        return lessonRepository.findByCourseIdOrderByLessonOrderAsc(courseId);
    }

    @Transactional
    public Lesson addLesson(Long courseId, String title, String description, LessonLevel level,
                            Integer lessonOrder, Integer duration, String artistId) {
        Course course = findById(courseId);

        Lesson lesson = Lesson.builder()
                .title(title).description(description).course(course)
                .artistId(artistId).level(level).lessonOrder(lessonOrder).duration(duration)
                .build();

        return lessonRepository.save(lesson);
    }

    @Transactional
    public void deleteLesson(Long lessonId) {
        lessonRepository.deleteById(lessonId);
    }

    // --- Planning ---

    public List<Planning> getAllPlanning() {
        return planningRepository.findAll();
    }

    public List<Planning> getPlanningByStatus(String status) {
        return planningRepository.findByStatus(status);
    }

    @Transactional
    public Planning createPlanning(Long courseId, Long lessonId, LocalDateTime startTime,
                                   LocalDateTime endTime, String room, String status, String notes) {
        Planning planning = Planning.builder()
                .course(courseId != null ? courseRepository.findById(courseId).orElse(null) : null)
                .lesson(lessonId != null ? lessonRepository.findById(lessonId).orElse(null) : null)
                .startTime(startTime).endTime(endTime).room(room).status(status).notes(notes)
                .build();

        return planningRepository.save(planning);
    }

    @Transactional
    public void deletePlanning(Long planningId) {
        planningRepository.deleteById(planningId);
    }
}
