package com.metamuse.controller;

import com.metamuse.model.Artwork;
import com.metamuse.model.Catalogue;
import com.metamuse.model.Category;
import com.metamuse.repository.CatalogueRepository;
import com.metamuse.repository.CategoryRepository;
import com.metamuse.service.ArtworkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/artworks")
@RequiredArgsConstructor
public class ArtworkController {

    private final ArtworkService artworkService;
    private final CategoryRepository categoryRepository;
    private final CatalogueRepository catalogueRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllArtworks() {
        return ResponseEntity.ok(artworkService.getAll().stream().map(this::toDto).collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getArtwork(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(toDto(artworkService.findById(id)));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<byte[]> getArtworkImage(@PathVariable Long id) {
        try {
            Artwork artwork = artworkService.findById(id);
            if (artwork.getImage() == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).body(artwork.getImage());
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<Map<String, Object>>> searchArtworks(@RequestParam String q) {
        return ResponseEntity.ok(artworkService.search(q).stream().map(this::toDto).collect(Collectors.toList()));
    }

    @PostMapping
    public ResponseEntity<?> createArtwork(@RequestBody Map<String, Object> body, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        try {
            String title = (String) body.get("title");
            String description = (String) body.get("description");
            Integer year = body.get("year") != null ? ((Number) body.get("year")).intValue() : null;
            Long categoryId = body.get("categoryId") != null ? ((Number) body.get("categoryId")).longValue() : null;
            Long catalogueId = body.get("catalogueId") != null ? ((Number) body.get("catalogueId")).longValue() : null;

            Artwork artwork = artworkService.create(title, description, year, categoryId, catalogueId, userId, null);
            return ResponseEntity.ok(toDto(artwork));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/image")
    public ResponseEntity<?> uploadArtworkImage(@PathVariable Long id,
                                                @RequestParam("file") MultipartFile file,
                                                Authentication auth) {
        String userId = (String) auth.getPrincipal();
        try {
            artworkService.updateWithPermission(id, null, null, null, null, null, userId, file);
            return ResponseEntity.ok(Map.of("message", "Image uploaded"));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateArtwork(@PathVariable Long id, @RequestBody Map<String, Object> body, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        try {
            String title = body.containsKey("title") ? (String) body.get("title") : null;
            String description = body.containsKey("description") ? (String) body.get("description") : null;
            Integer year = body.get("year") != null ? ((Number) body.get("year")).intValue() : null;
            Long categoryId = body.get("categoryId") != null ? ((Number) body.get("categoryId")).longValue() : null;
            Long catalogueId = body.get("catalogueId") != null ? ((Number) body.get("catalogueId")).longValue() : null;

            Artwork artwork = artworkService.updateWithPermission(id, title, description, year, categoryId, catalogueId, userId, null);
            return ResponseEntity.ok(toDto(artwork));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteArtwork(@PathVariable Long id, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        try {
            artworkService.deleteWithPermission(id, userId);
            return ResponseEntity.ok(Map.of("message", "Artwork deleted"));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // --- Categories ---
    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories() {
        return ResponseEntity.ok(categoryRepository.findAll());
    }

    @PostMapping("/categories")
    public ResponseEntity<Category> createCategory(@RequestBody Map<String, String> body) {
        Category category = Category.builder().name(body.get("name")).build();
        return ResponseEntity.ok(categoryRepository.save(category));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        categoryRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Category deleted"));
    }

    // --- Catalogues ---
    @GetMapping("/catalogues")
    public ResponseEntity<List<Catalogue>> getCatalogues() {
        return ResponseEntity.ok(catalogueRepository.findAll());
    }

    @PostMapping("/catalogues")
    public ResponseEntity<Catalogue> createCatalogue(@RequestBody Map<String, String> body) {
        Catalogue catalogue = Catalogue.builder().name(body.get("name")).description(body.get("description")).build();
        return ResponseEntity.ok(catalogueRepository.save(catalogue));
    }

    @DeleteMapping("/catalogues/{id}")
    public ResponseEntity<?> deleteCatalogue(@PathVariable Long id) {
        catalogueRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Catalogue deleted"));
    }

    private Map<String, Object> toDto(Artwork artwork) {
        var dto = new HashMap<String, Object>();
        dto.put("id", artwork.getId());
        dto.put("title", artwork.getTitle());
        dto.put("description", artwork.getDescription());
        dto.put("year", artwork.getYear());
        dto.put("hasImage", artwork.getImage() != null);
        dto.put("artist", artwork.getArtist() != null ? Map.of(
                "idNumber", artwork.getArtist().getIdNumber(),
                "username", artwork.getArtist().getUsername()
        ) : null);
        dto.put("category", artwork.getCategory() != null ? Map.of(
                "id", artwork.getCategory().getId(),
                "name", artwork.getCategory().getName()
        ) : null);
        dto.put("catalogue", artwork.getCatalogue() != null ? Map.of(
                "id", artwork.getCatalogue().getId(),
                "name", artwork.getCatalogue().getName()
        ) : null);
        return dto;
    }
}
