package at.technikum.clil.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;

@Slf4j
@Configuration
public class RagServiceConfig {

    @Value("${rag.service.url}")
    private String ragServiceUrl;

    @Bean
    public WebClient ragServiceWebClient() {
        log.info("Configuring RAG service WebClient with URL: {}", ragServiceUrl);

        return WebClient.builder()
                .baseUrl(ragServiceUrl)
                .defaultHeader("Content-Type", "application/json")
                .exchangeStrategies(ExchangeStrategies.builder()
                        .codecs(configurer -> configurer.defaultCodecs()
                                .maxInMemorySize(10 * 1024 * 1024))
                        .build())
                .build();
    }
}
