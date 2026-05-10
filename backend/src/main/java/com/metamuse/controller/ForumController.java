package com.metamuse.controller;

import com.metamuse.model.*;
import com.metamuse.service.ForumService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/forum")
@RequiredArgsConstructor
public class ForumController {

    private final ForumService forumService;

    // --- Posts ---
    @GetMapping("/posts")
    public ResponseEntity<List<Map<String, Object>>> getPosts() {
        return ResponseEntity.ok(forumService.getAll().stream().map(this::postToDto).collect(Collectors.toList()));
    }

    @PostMapping("/posts")
    public ResponseEntity<?> createPost(@RequestBody Map<String, String> body, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        Post post = forumService.createPost(userId, body.get("title"), body.get("content"));
        return ResponseEntity.ok(postToDto(post));
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id) {
        forumService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Post deleted"));
    }

    // --- Comments ---
    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<List<Map<String, Object>>> getComments(@PathVariable Long postId) {
        return ResponseEntity.ok(forumService.getComments(postId).stream().map(c -> {
            var dto = new HashMap<String, Object>();
            dto.put("id", c.getId());
            dto.put("content", c.getContent());
            dto.put("user", c.getUser() != null ? c.getUser().getUsername() : "Anonymous");
            return (Map<String, Object>) dto;
        }).collect(Collectors.toList()));
    }

    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<?> addComment(@PathVariable Long postId, @RequestBody Map<String, String> body, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        forumService.addComment(postId, userId, body.get("content"));
        return ResponseEntity.ok(Map.of("message", "Comment added"));
    }

    // --- Discussions ---
    @GetMapping("/discussions")
    public ResponseEntity<List<Map<String, Object>>> getDiscussions() {
        return ResponseEntity.ok(forumService.getAllDiscussions().stream().map(d -> {
            var dto = new HashMap<String, Object>();
            dto.put("id", d.getId());
            dto.put("title", d.getTitle());
            dto.put("description", d.getDescription());
            dto.put("user", d.getUser() != null ? d.getUser().getUsername() : "Anonymous");
            return (Map<String, Object>) dto;
        }).collect(Collectors.toList()));
    }

    @PostMapping("/discussions")
    public ResponseEntity<?> createDiscussion(@RequestBody Map<String, String> body, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        forumService.createDiscussion(userId, body.get("title"), body.get("description"));
        return ResponseEntity.ok(Map.of("message", "Discussion created"));
    }

    // --- Messages ---
    @GetMapping("/discussions/{discussionId}/messages")
    public ResponseEntity<List<Map<String, Object>>> getMessages(@PathVariable Long discussionId) {
        return ResponseEntity.ok(forumService.getMessages(discussionId).stream().map(m -> {
            var dto = new HashMap<String, Object>();
            dto.put("id", m.getId());
            dto.put("content", m.getContent());
            dto.put("sender", m.getSender() != null ? m.getSender().getUsername() : "Anonymous");
            return (Map<String, Object>) dto;
        }).collect(Collectors.toList()));
    }

    @PostMapping("/discussions/{discussionId}/messages")
    public ResponseEntity<?> sendMessage(@PathVariable Long discussionId, @RequestBody Map<String, String> body, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        forumService.sendMessage(discussionId, userId, body.get("content"));
        return ResponseEntity.ok(Map.of("message", "Message sent"));
    }

    private Map<String, Object> postToDto(Post p) {
        var dto = new HashMap<String, Object>();
        dto.put("id", p.getId());
        dto.put("title", p.getTitle());
        dto.put("content", p.getContent());
        dto.put("user", p.getUser() != null ? p.getUser().getUsername() : "Anonymous");
        dto.put("status", p.getStatus());
        return dto;
    }
}
