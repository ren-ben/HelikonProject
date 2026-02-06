package at.technikum.clil.service;

import at.technikum.clil.dto.ClilResponse;
import at.technikum.clil.dto.MaterialRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class RagProxyService {

    private final WebClient webClient;

    public RagProxyService(@Qualifier("ragServiceWebClient") WebClient webClient) {
        this.webClient = webClient;
    }

    /**
     * Lists available LLM models from the Python RAG service.
     */
    @SuppressWarnings("unchecked")
    public Mono<List<String>> listAvailableModels() {
        log.info("Fetching available models from RAG service");

        return webClient.get()
                .uri("/rag/models")
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(response -> {
                    List<String> models = (List<String>) response.get("models");
                    if (models == null || models.isEmpty()) {
                        log.warn("No models returned from RAG service");
                        return List.of("gpt-4o-mini");
                    }
                    log.info("RAG service models ({}): {}", response.get("provider"), models);
                    return models;
                })
                .onErrorResume(error -> {
                    log.error("Error fetching models from RAG service: {}", error.getMessage());
                    return Mono.just(List.of("gpt-4o-mini"));
                });
    }

    /**
     * Proxies a generation request to the Python RAG service.
     * Always returns a ClilResponse (errors are wrapped in HTML, matching the
     * existing frontend contract).
     */
    public Mono<ClilResponse> generateMaterial(MaterialRequest request) {
        log.info("Proxying generate request to RAG service — model: {}", request.getModelName());

        return webClient.post()
                .uri("/rag/generate")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(ClilResponse.class)
                .doOnSuccess(resp -> log.info("Generation proxied successfully"))
                .onErrorResume(error -> {
                    log.error("Error proxying generation: {}", error.getMessage());
                    return Mono.just(ClilResponse.builder()
                            .formattedResponse(
                                    "<div class='error'><h3>Error generating content</h3><p>"
                                            + error.getMessage() + "</p></div>")
                            .build());
                });
    }
}
