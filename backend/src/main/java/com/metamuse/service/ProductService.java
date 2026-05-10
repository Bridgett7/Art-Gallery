package com.metamuse.service;

import com.metamuse.model.Product;
import com.metamuse.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService implements IService<Product> {

    private final ProductRepository productRepository;

    @Override
    @Transactional
    public Product add(Product product) {
        return productRepository.save(product);
    }

    @Override
    @Transactional
    public Product update(Product product) {
        if (!productRepository.existsById(product.getId())) {
            throw new RuntimeException("Product not found with id: " + product.getId());
        }
        return productRepository.save(product);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!productRepository.existsById(id)) {
            throw new RuntimeException("Product not found with id: " + id);
        }
        productRepository.deleteById(id);
    }

    @Override
    public Product findById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
    }

    @Override
    public List<Product> getAll() {
        return productRepository.findAll();
    }

    // --- Business methods ---

    public List<Product> search(String query) {
        return productRepository.findByNameContainingIgnoreCase(query);
    }

    @Transactional
    public Product create(String name, String description, Double price, Integer stock, MultipartFile imageFile) {
        if (name == null || name.isBlank()) {
            throw new RuntimeException("Product name is required");
        }

        byte[] imageBytes = null;
        if (imageFile != null && !imageFile.isEmpty()) {
            try {
                imageBytes = imageFile.getBytes();
            } catch (IOException e) {
                throw new RuntimeException("Failed to process image", e);
            }
        }

        Product product = Product.builder()
                .name(name).description(description).price(price).stock(stock != null ? stock : 0)
                .image(imageBytes)
                .build();

        return add(product);
    }

    @Transactional
    public Product updateFields(Long id, String name, String description, Double price, Integer stock, MultipartFile imageFile) {
        Product product = findById(id);

        if (name != null) product.setName(name);
        if (description != null) product.setDescription(description);
        if (price != null) product.setPrice(price);
        if (stock != null) product.setStock(stock);

        if (imageFile != null && !imageFile.isEmpty()) {
            try {
                product.setImage(imageFile.getBytes());
            } catch (IOException e) {
                throw new RuntimeException("Failed to process image", e);
            }
        }

        return update(product);
    }
}
