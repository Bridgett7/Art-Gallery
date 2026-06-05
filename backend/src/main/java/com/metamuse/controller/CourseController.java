package com.metamuse.controller;

import com.metamuse.enums.LessonLevel;
import com.metamuse.model.Course;
import com.metamuse.model.Lesson;
import com.metamuse.model.Planning;
import com.metamuse.service.CourseService;
import com.metamuse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;
    private final UserRepository userRepository;

    // --- Courses ---
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAll() {
        return ResponseEntity.ok(courseService.getAll().stream().map(this::courseToDto).collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(courseToDto(courseService.findById(id)));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<Map<String, Object>>> search(@RequestParam String q) {
        return ResponseEntity.ok(courseService.search(q).stream().map(this::courseToDto).collect(Collectors.toList()));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        try {
            Course course = Course.builder()
                    .title((String) body.get("title"))
                    .description((String) body.get("description"))
                    .level(body.get("level") != null ? LessonLevel.valueOf((String) body.get("level")) : null)
                    .duration(body.get("duration") != null ? ((Number) body.get("duration")).intValue() : null)
                    .price(body.get("price") != null ? ((Number) body.get("price")).doubleValue() : null)
                    .artistId(userId)
                    .build();
            course = courseService.add(course);
            return ResponseEntity.ok(courseToDto(course));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Course course = courseService.findById(id);
            if (body.containsKey("title")) course.setTitle((String) body.get("title"));
            if (body.containsKey("description")) course.setDescription((String) body.get("description"));
            if (body.containsKey("level")) course.setLevel(LessonLevel.valueOf((String) body.get("level")));
            if (body.containsKey("duration")) course.setDuration(body.get("duration") != null ? ((Number) body.get("duration")).intValue() : null);
            if (body.containsKey("price")) course.setPrice(body.get("price") != null ? ((Number) body.get("price")).doubleValue() : null);
            course = courseService.update(course);
            return ResponseEntity.ok(courseToDto(course));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        courseService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Course deleted"));
    }

    // --- Lessons ---
    @GetMapping("/{courseId}/lessons")
    public ResponseEntity<List<Map<String, Object>>> getLessons(@PathVariable Long courseId) {
        return ResponseEntity.ok(courseService.getLessons(courseId).stream().map(this::lessonToDto).collect(Collectors.toList()));
    }

    @PostMapping("/{courseId}/lessons")
    public ResponseEntity<?> createLesson(@PathVariable Long courseId, @RequestBody Map<String, Object> body, Authentication auth) {
        try {
            Lesson lesson = courseService.addLesson(
                    courseId,
                    (String) body.get("title"),
                    (String) body.get("description"),
                    body.get("level") != null ? LessonLevel.valueOf((String) body.get("level")) : null,
                    body.get("lessonOrder") != null ? ((Number) body.get("lessonOrder")).intValue() : null,
                    body.get("duration") != null ? ((Number) body.get("duration")).intValue() : null,
                    (String) auth.getPrincipal()
            );
            return ResponseEntity.ok(lessonToDto(lesson));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/lessons/{id}")
    public ResponseEntity<?> deleteLesson(@PathVariable Long id) {
        courseService.deleteLesson(id);
        return ResponseEntity.ok(Map.of("message", "Lesson deleted"));
    }

    @GetMapping("/lessons/{id}")
    public ResponseEntity<?> getLessonDetail(@PathVariable Long id) {
        return courseService.getLessonById(id)
                .map(l -> {
                    var dto = lessonDetailToDto(l);
                    return ResponseEntity.ok(dto);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/lessons/{id}/content")
    public ResponseEntity<?> updateLessonContent(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            var lesson = courseService.getLessonById(id).orElseThrow();
            lesson.setContent(body.get("content"));
            courseService.updateLesson(lesson);
            return ResponseEntity.ok(Map.of("message", "Content updated"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/lessons/{id}/attachment")
    public ResponseEntity<?> uploadLessonAttachment(@PathVariable Long id,
                                                    @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            var lesson = courseService.getLessonById(id).orElseThrow();
            lesson.setAttachment(file.getBytes());
            lesson.setAttachmentName(file.getOriginalFilename());
            courseService.updateLesson(lesson);
            return ResponseEntity.ok(Map.of("message", "Attachment uploaded", "filename", file.getOriginalFilename()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Upload failed"));
        }
    }

    @GetMapping("/lessons/{id}/attachment")
    public ResponseEntity<byte[]> downloadLessonAttachment(@PathVariable Long id) {
        var lesson = courseService.getLessonById(id).orElse(null);
        if (lesson == null || lesson.getAttachment() == null) return ResponseEntity.notFound().build();
        String filename = lesson.getAttachmentName() != null ? lesson.getAttachmentName() : "attachment.pdf";
        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                .body(lesson.getAttachment());
    }

    // --- Planning ---
    @GetMapping("/planning")
    public ResponseEntity<List<Map<String, Object>>> getAllPlanning() {
        return ResponseEntity.ok(courseService.getAllPlanning().stream().map(this::planningToDto).collect(Collectors.toList()));
    }

    @PostMapping("/planning")
    public ResponseEntity<?> createPlanning(@RequestBody Map<String, Object> body) {
        try {
            Long courseId = body.get("courseId") != null ? ((Number) body.get("courseId")).longValue() : null;
            Long lessonId = body.get("lessonId") != null ? ((Number) body.get("lessonId")).longValue() : null;

            Planning planning = courseService.createPlanning(
                    courseId, lessonId,
                    body.get("startTime") != null ? LocalDateTime.parse((String) body.get("startTime")) : null,
                    body.get("endTime") != null ? LocalDateTime.parse((String) body.get("endTime")) : null,
                    (String) body.get("room"),
                    (String) body.get("status"),
                    (String) body.get("notes")
            );
            return ResponseEntity.ok(planningToDto(planning));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/planning/{id}")
    public ResponseEntity<?> deletePlanning(@PathVariable Long id) {
        courseService.deletePlanning(id);
        return ResponseEntity.ok(Map.of("message", "Planning deleted"));
    }

    private Map<String, Object> courseToDto(Course c) {
        var dto = new HashMap<String, Object>();
        dto.put("id", c.getId());
        dto.put("title", c.getTitle());
        dto.put("description", c.getDescription());
        dto.put("level", c.getLevel() != null ? c.getLevel().name() : null);
        dto.put("price", c.getPrice());
        dto.put("duration", c.getDuration());
        dto.put("artistId", c.getArtistId());
        return dto;
    }

    private Map<String, Object> lessonToDto(Lesson l) {
        var dto = new HashMap<String, Object>();
        dto.put("id", l.getId());
        dto.put("title", l.getTitle());
        dto.put("description", l.getDescription());
        dto.put("level", l.getLevel() != null ? l.getLevel().name() : null);
        dto.put("lessonOrder", l.getLessonOrder());
        dto.put("duration", l.getDuration());
        dto.put("hasContent", l.getContent() != null && !l.getContent().isBlank());
        dto.put("hasAttachment", l.getAttachment() != null);
        dto.put("attachmentName", l.getAttachmentName());
        return dto;
    }

    private Map<String, Object> lessonDetailToDto(Lesson l) {
        var dto = lessonToDto(l);
        dto.put("content", l.getContent());
        return dto;
    }

    private Map<String, Object> planningToDto(Planning p) {
        var dto = new HashMap<String, Object>();
        dto.put("id", p.getId());
        dto.put("course", p.getCourse() != null ? p.getCourse().getTitle() : null);
        dto.put("lesson", p.getLesson() != null ? p.getLesson().getTitle() : null);
        dto.put("startTime", p.getStartTime() != null ? p.getStartTime().toString() : null);
        dto.put("endTime", p.getEndTime() != null ? p.getEndTime().toString() : null);
        dto.put("room", p.getRoom());
        dto.put("status", p.getStatus());
        dto.put("notes", p.getNotes());
        // Resolve artist name
        String artistName = null;
        if (p.getCourse() != null && p.getCourse().getArtistId() != null) {
            artistName = userRepository.findById(p.getCourse().getArtistId())
                    .map(u -> u.getUsername())
                    .orElse(null);
        }
        dto.put("createdBy", artistName);
        return dto;
    }
}
