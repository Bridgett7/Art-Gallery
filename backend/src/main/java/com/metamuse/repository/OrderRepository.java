package com.metamuse.repository;

import com.metamuse.enums.OrderStatus;
import com.metamuse.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserIdNumber(String userId);

    List<Order> findByStatus(OrderStatus status);

    Optional<Order> findByUserIdNumberAndStatus(String userId, OrderStatus status);
}
