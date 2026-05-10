package com.metamuse.repository;

import com.metamuse.model.Artwork;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArtworkRepository extends JpaRepository<Artwork, Long> {

    List<Artwork> findByArtistIdNumber(String artistId);

    List<Artwork> findByCategoryId(Long categoryId);

    List<Artwork> findByCatalogueId(Long catalogueId);

    List<Artwork> findByTitleContainingIgnoreCase(String title);
}
