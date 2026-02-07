package at.technikum.clil.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class DocumentProxyService {

    private final WebClient webClient;

    public DocumentProxyService(@Qualifier("ragServiceWebClient") WebClient webClient) {
        this.webClient = webClient;
    }

    /**
     * Uploads a document to the Python RAG service for ingestion.
     */
    public Mono<Map<String, Object>> uploadDocument(MultipartFile file, Long userId) {
        log.info("Proxying document upload to RAG service — file: {}, userId: {}", file.getOriginalFilename(), userId);

        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", file.getResource());
        builder.part("metadata", "{\"user_id\": \"" + userId + "\"}");

        return webClient.post()
                .uri("/rag/ingest")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .doOnSuccess(resp -> log.info("Document uploaded successfully: {}", resp))
                .onErrorResume(error -> {
                    log.error("Error uploading document: {}", error.getMessage());
                    return Mono.just(Map.of("error", error.getMessage()));
                });
    }

    /**
     * Queries documents via RAG from the Python service.
     */
    public Mono<Map<String, Object>> queryDocuments(String query, Long userId, int topK) {
        log.info("Proxying RAG query — userId: {}, topK: {}", userId, topK);

        Map<String, Object> body = Map.of(
                "query", query,
                "user_id", userId.toString(),
                "top_k", topK
        );

        return webClient.post()
                .uri("/rag/query")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .doOnSuccess(resp -> log.info("RAG query completed successfully"))
                .onErrorResume(error -> {
                    log.error("Error querying documents: {}", error.getMessage());
                    return Mono.just(Map.of("error", error.getMessage()));
                });
    }

    /**
     * Lists all documents for a given user.
     */
    public Mono<List<Map<String, Object>>> listDocuments(Long userId) {
        log.info("Fetching document list for userId: {}", userId);

        return webClient.get()
                .uri(uriBuilder -> uriBuilder.path("/rag/documents")
                        .queryParam("user_id", userId.toString())
                        .build())
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                .doOnSuccess(docs -> log.info("Fetched {} documents", docs != null ? docs.size() : 0))
                .onErrorResume(error -> {
                    log.error("Error listing documents: {}", error.getMessage());
                    return Mono.just(List.of());
                });
    }

    /**
     * Deletes documents by their IDs.
     */
    public Mono<Map<String, Object>> deleteDocuments(List<String> docIds) {
        log.info("Proxying document delete — docIds: {}", docIds);

        return webClient.method(org.springframework.http.HttpMethod.DELETE)
                .uri("/rag/documents")
                .bodyValue(Map.of("doc_ids", docIds))
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .doOnSuccess(resp -> log.info("Documents deleted: {}", resp))
                .onErrorResume(error -> {
                    log.error("Error deleting documents: {}", error.getMessage());
                    return Mono.just(Map.of("error", error.getMessage()));
                });
    }
}
