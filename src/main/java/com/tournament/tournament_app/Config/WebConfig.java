package com.tournament.tournament_app.Config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import com.tournament.tournament_app.security.TournamentAccessInterceptor;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Autowired
    private TournamentAccessInterceptor interceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(interceptor);
    }
}
