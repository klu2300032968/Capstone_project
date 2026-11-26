package com.project.security.controller;

import com.project.security.dto.ProductDTO;
import com.project.security.exception.ResourceNotFoundException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/public/products")
public class ProductController {

    private final List<ProductDTO> sampleProducts = Arrays.asList(
            new ProductDTO(1L, "Enterprise API Gateway Pro", "Security Software", new BigDecimal("499.99"), true),
            new ProductDTO(2L, "Web Application Firewall Guard", "Security Software", new BigDecimal("299.99"), true),
            new ProductDTO(3L, "Network Intrusion Detector", "Hardware Appliance", new BigDecimal("1299.00"), true),
            new ProductDTO(4L, "Zero-Trust Identity Module", "Security Software", new BigDecimal("199.50"), false)
    );

    @GetMapping
    public ResponseEntity<List<ProductDTO>> getAllProducts() {
        return ResponseEntity.ok(sampleProducts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDTO> getProductById(@PathVariable Long id) {
        ProductDTO product = sampleProducts.stream()
                .filter(p -> p.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return ResponseEntity.ok(product);
    }
}
