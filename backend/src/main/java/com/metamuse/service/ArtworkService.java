package com.metamuse.service;

import com.metamuse.model.*;
import com.metamuse.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ArtworkService implements IService<Artwork> {

    private final ArtworkRepository artworkRepository;
    private final CategoryRepository categoryRepository;
    private final CatalogueRepository catalogueRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public Artwork add(Artwork artwork) {
        return artworkRepository.save(artwork);
    }

    @Override
    @Transactional
    public Artwork update(Artwork artwork) {
        if (!artworkRepository.existsById(artwork.getId())) {
            throw new RuntimeException("Artwork not found with id: " + artwork.getId());
        }
        return artworkRepository.save(artwork);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!artworkRepository.existsById(id)) {
            throw new RuntimeException("Artwork not found with id: " + id);
        }
        artworkRepository.deleteById(id);
    }

    @Override
    public Artwork findById(Long id) {
        return artworkRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Artwork not found with id: " + id));
    }

    @Override
    public List<Artwork> getAll() {
        return artworkRepository.findAll();
    }

    // --- Business methods ---

    public List<Artwork> findByArtist(String artistId) {
        return artworkRepository.findByArtistIdNumber(artistId);
    }

    public List<Artwork> search(String query) {
        return artworkRepository.findByTitleContainingIgnoreCase(query);
    }

    @Transactional
    public Artwork create(String title, String description, Integer year,
                          Long categoryId, Long catalogueId, String artistId, MultipartFile imageFile) {
        User artist = userRepository.findById(artistId)
                .orElseThrow(() -> new RuntimeException("Artist not found"));

        if (!artist.getRole().name().equals("ARTIST") && !artist.getRole().name().equals("ADMIN")) {
            throw new SecurityException("Only artists and admins can create artworks");
        }

        Category category = categoryId != null ? categoryRepository.findById(categoryId).orElse(null) : null;
        Catalogue catalogue = catalogueId != null ? catalogueRepository.findById(catalogueId).orElse(null) : null;

        byte[] imageBytes = null;
        if (imageFile != null && !imageFile.isEmpty()) {
            try {
                imageBytes = imageFile.getBytes();
            } catch (IOException e) {
                throw new RuntimeException("Failed to process image", e);
            }
        }

        Artwork artwork = Artwork.builder()
                .title(title).description(description).year(year)
                .image(imageBytes).artist(artist).category(category).catalogue(catalogue)
                .build();

        return add(artwork);
    }

    @Transactional
    public Artwork updateWithPermission(Long id, String title, String description, Integer year,
                                        Long categoryId, Long catalogueId, String currentUserId, MultipartFile imageFile) {
        Artwork artwork = findById(id);
        validatePermission(artwork, currentUserId);

        if (title != null) artwork.setTitle(title);
        if (description != null) artwork.setDescription(description);
        if (year != null) artwork.setYear(year);
        if (categoryId != null) categoryRepository.findById(categoryId).ifPresent(artwork::setCategory);
        if (catalogueId != null) catalogueRepository.findById(catalogueId).ifPresent(artwork::setCatalogue);

        if (imageFile != null && !imageFile.isEmpty()) {
            try {
                artwork.setImage(imageFile.getBytes());
            } catch (IOException e) {
                throw new RuntimeException("Failed to process image", e);
            }
        }

        return update(artwork);
    }

    @Transactional
    public void deleteWithPermission(Long id, String currentUserId) {
        Artwork artwork = findById(id);
        validatePermission(artwork, currentUserId);
        delete(id);
    }

    private void validatePermission(Artwork artwork, String userId) {
        User currentUser = userRepository.findById(userId).orElseThrow();
        if (!currentUser.getRole().name().equals("ADMIN") &&
            !artwork.getArtist().getIdNumber().equals(userId)) {
            throw new SecurityException("Not authorized to modify this artwork");
        }
    }
}
