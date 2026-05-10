package com.metamuse.service;

import com.metamuse.model.*;
import com.metamuse.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final ArtworkRepository artworkRepository;
    private final EventRepository eventRepository;
    private final ProductRepository productRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    /**
     * Global search across all entities.
     */
    public Map<String, Object> globalSearch(String query) {
        Map<String, Object> results = new HashMap<>();

        results.put("artworks", artworkRepository.findByTitleContainingIgnoreCase(query).stream()
                .map(a -> Map.of("id", a.getId(), "title", a.getTitle(), "type", "artwork"))
                .collect(Collectors.toList()));

        results.put("events", eventRepository.search(query).stream()
                .map(e -> Map.of("id", e.getId(), "name", e.getName(), "type", "event"))
                .collect(Collectors.toList()));

        results.put("products", productRepository.findByNameContainingIgnoreCase(query).stream()
                .map(p -> Map.of("id", p.getId(), "name", p.getName(), "type", "product"))
                .collect(Collectors.toList()));

        results.put("courses", courseRepository.findByTitleContainingIgnoreCase(query).stream()
                .map(c -> Map.of("id", c.getId(), "title", c.getTitle(), "type", "course"))
                .collect(Collectors.toList()));

        return results;
    }
}
