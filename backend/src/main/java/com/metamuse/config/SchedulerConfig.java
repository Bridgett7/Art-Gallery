package com.metamuse.config;

import com.metamuse.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration
@EnableScheduling
@RequiredArgsConstructor
public class SchedulerConfig {

    private final OrderService orderService;

    /**
     * Run every hour to auto-progress orders.
     */
    @Scheduled(fixedRate = 3600000)
    public void autoProgressOrders() {
        orderService.autoProgressOrders();
    }
}
