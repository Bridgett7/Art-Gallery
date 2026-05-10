package com.metamuse.controller;

import com.metamuse.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileUploadController {

    private final FileStorageService fileStorageService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file,
                                        @RequestParam(value = "category", defaultValue = "general") String category,
                                        Authentication auth) {
        String userId = (String) auth.getPrincipal();
        String subDir = category + "/" + userId;
        String path = fileStorageService.store(file, subDir);
        return ResponseEntity.ok(Map.of("path", path, "url", "/uploads/" + path));
    }

    @GetMapping("/download/{*path}")
    public ResponseEntity<byte[]> downloadFile(@PathVariable String path) {
        byte[] data = fileStorageService.load(path);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(data);
    }
}
