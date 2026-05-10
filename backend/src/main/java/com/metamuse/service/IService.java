package com.metamuse.service;

import java.util.List;

/**
 * Generic service interface defining standard CRUD operations.
 * All domain services must implement this contract.
 *
 * @param <T> the entity type
 */
public interface IService<T> {

    T add(T entity);

    T update(T entity);

    void delete(Long id);

    T findById(Long id);

    List<T> getAll();
}
