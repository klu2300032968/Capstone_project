package com.project.security.dto;

import java.math.BigDecimal;

public class ProductDTO {

    private Long id;
    private String name;
    private String category;
    private BigDecimal price;
    private boolean inStock;

    public ProductDTO() {
    }

    public ProductDTO(Long id, String name, String category, BigDecimal price, boolean inStock) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.price = price;
        this.inStock = inStock;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public boolean isInStock() {
        return inStock;
    }

    public void setInStock(boolean inStock) {
        this.inStock = inStock;
    }
}
