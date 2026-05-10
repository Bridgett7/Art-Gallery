package com.metamuse.repository;

import com.metamuse.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByUserIdNumber(String userId);

    List<Ticket> findByEventId(Long eventId);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.event.id = :eventId")
    int countByEventId(Long eventId);

    @Query("SELECT COALESCE(SUM(t.price), 0) FROM Ticket t WHERE t.event.id = :eventId")
    Double getRevenueByEventId(Long eventId);
}
