package com.metamuse.controller;

import com.metamuse.model.Product;
import com.metamuse.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAll() {
        return ResponseEntity.ok(productService.getAll().stream().map(this::toDto).collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(toDto(productService.findById(id)));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<byte[]> getImage(@PathVariable Long id) {
        try {
            Product product = productService.findById(id);
            if (product.getImage() == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).body(product.getImage());
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<Map<String, Object>>> search(@RequestParam String q) {
        return ResponseEntity.ok(productService.search(q).stream().map(this::toDto).collect(Collectors.toList()));
    }

    @PostMapping("/{id}/image")
    public ResponseEntity<?> uploadProductImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        try {
            productService.updateFields(id, null, null, null, null, file);
            return ResponseEntity.ok(Map.of("message", "Image uploaded"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        try {
            Product product = productService.create(
                    (String) body.get("name"),
                    (String) body.get("description"),
                    body.get("price") != null ? ((Number) body.get("price")).doubleValue() : null,
                    body.get("stock") != null ? ((Number) body.get("stock")).intValue() : 0,
                    null
            );
            return ResponseEntity.ok(toDto(product));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Product product = productService.updateFields(
                    id,
                    body.containsKey("name") ? (String) body.get("name") : null,
                    body.containsKey("description") ? (String) body.get("description") : null,
                    body.get("price") != null ? ((Number) body.get("price")).doubleValue() : null,
                    body.get("stock") != null ? ((Number) body.get("stock")).intValue() : null,
                    null
            );
            return ResponseEntity.ok(toDto(product));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            productService.delete(id);
            return ResponseEntity.ok(Map.of("message", "Product deleted"));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    private Map<String, Object> toDto(Product p) {
        var dto = new HashMap<String, Object>();
        dto.put("id", p.getId());
        dto.put("name", p.getName());
        dto.put("description", p.getDescription());
        dto.put("price", p.getPrice());
        dto.put("stock", p.getStock());
        dto.put("hasImage", p.getImage() != null);
        return dto;
    }
}
