package com.metamuse.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.Map;

@Service
public class QRCodeService {

    /**
     * Generate a QR code image as PNG bytes.
     */
    public byte[] generateQRCode(String content, int width, int height) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix bitMatrix = writer.encode(content, BarcodeFormat.QR_CODE, width, height,
                    Map.of(EncodeHintType.MARGIN, 1));

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }

    /**
     * Generate QR code for a ticket.
     */
    public byte[] generateTicketQR(Long ticketId, String eventName, String userName) {
        String content = String.format("METAMUSE-TICKET|ID:%d|EVENT:%s|USER:%s", ticketId, eventName, userName);
        return generateQRCode(content, 250, 250);
    }
}
