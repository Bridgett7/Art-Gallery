package com.metamuse.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.File;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@metamuse.com}")
    private String fromEmail;

    @Async
    public void sendSimpleEmail(String to, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false);
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true); // HTML enabled
            mailSender.send(message);
            log.info("Email sent to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    @Async
    public void sendEmailWithAttachment(String to, String subject, String body, File attachment) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true);

            if (attachment != null && attachment.exists()) {
                FileSystemResource resource = new FileSystemResource(attachment);
                helper.addAttachment(attachment.getName(), resource);
            }

            mailSender.send(message);
            log.info("Email with attachment sent to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send email with attachment to {}: {}", to, e.getMessage());
        }
    }

    /**
     * Send order confirmation email.
     */
    public void sendOrderConfirmation(String to, String username, Long orderId) {
        String subject = "MetaMuse - Order #" + orderId + " Confirmed";
        String body = """
                <h2>Order Confirmation</h2>
                <p>Hello %s,</p>
                <p>Your order <strong>#%d</strong> has been confirmed.</p>
                <p>You will receive updates as your order progresses.</p>
                <br>
                <p>Thank you for shopping with MetaMuse!</p>
                """.formatted(username, orderId);
        sendSimpleEmail(to, subject, body);
    }

    /**
     * Send invoice email with PDF attachment.
     */
    public void sendInvoiceEmail(String to, String username, Long orderId, File invoicePdf) {
        String subject = "MetaMuse - Invoice for Order #" + orderId;
        String body = """
                <h2>Your Invoice</h2>
                <p>Hello %s,</p>
                <p>Please find attached the invoice for your order <strong>#%d</strong>.</p>
                <br>
                <p>Thank you for your purchase!</p>
                """.formatted(username, orderId);
        sendEmailWithAttachment(to, subject, body, invoicePdf);
    }
}
