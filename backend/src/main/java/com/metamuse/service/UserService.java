package com.metamuse.service;

import com.metamuse.model.Address;
import com.metamuse.model.User;
import com.metamuse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService implements IService<User> {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;

    @Override
    @Transactional
    public User add(User user) {
        return userRepository.save(user);
    }

    @Override
    @Transactional
    public User update(User user) {
        if (!userRepository.existsById(user.getIdNumber())) {
            throw new RuntimeException("User not found");
        }
        return userRepository.save(user);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        // User uses String ID, this is a workaround for the interface
        throw new UnsupportedOperationException("Use deleteByIdNumber(String) instead");
    }

    @Transactional
    public void deleteByIdNumber(String idNumber) {
        userRepository.deleteById(idNumber);
    }

    @Override
    public User findById(Long id) {
        throw new UnsupportedOperationException("Use findByIdNumber(String) instead");
    }

    public User findByIdNumber(String idNumber) {
        return userRepository.findById(idNumber)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    public List<User> getAll() {
        return userRepository.findAll();
    }

    // --- Business methods ---

    @Transactional
    public User updateProfile(String userId, String username, String email) {
        User user = findByIdNumber(userId);

        if (username != null && !username.equals(user.getUsername())) {
            if (userRepository.existsByUsername(username)) {
                throw new RuntimeException("Username already taken");
            }
            user.setUsername(username);
        }

        if (email != null && !email.equals(user.getEmail())) {
            if (userRepository.existsByEmail(email)) {
                throw new RuntimeException("Email already taken");
            }
            user.setEmail(email);
        }

        return userRepository.save(user);
    }

    @Transactional
    public void changePassword(String userId, String currentPassword, String newPassword) {
        User user = findByIdNumber(userId);

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional
    public User updateAddress(String userId, String street, String city, String country, String postalCode) {
        User user = findByIdNumber(userId);

        Address address = user.getAddress();
        if (address == null) {
            address = new Address();
        }
        address.setStreet(street);
        address.setCity(city);
        address.setCountry(country);
        address.setPostalCode(postalCode);
        user.setAddress(address);

        return userRepository.save(user);
    }

    @Transactional
    public User updateProfilePicture(String userId, MultipartFile file) {
        User user = findByIdNumber(userId);
        String path = fileStorageService.store(file, "profiles/" + userId);
        user.setProfilePicture(path);
        return userRepository.save(user);
    }
}
