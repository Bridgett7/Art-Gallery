package com.metamuse.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PasswordResetConfirm {
    @NotBlank @Email
    private String email;

    @NotBlank
    private String code;

    @NotBlank @Size(min = 8, max = 128)
    private String newPassword;
}
