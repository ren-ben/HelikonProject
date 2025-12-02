package at.technikum.clil.service;

import at.technikum.clil.dto.ClilResponse;
import at.technikum.clil.dto.OllamaChatRequest;
import at.technikum.clil.dto.OllamaChatResponse;
import at.technikum.clil.dto.OllamaModelListResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
public class OllamaService {

    private final WebClient webClient;
    private final PromptService promptService;

    @Value("${ollama.api.default-model:llama3.2}")
    private String defaultModel;

    public OllamaService(@Qualifier("ollamaWebClient") WebClient webClient,
                         PromptService promptService) {
        this.webClient = webClient;
        this.promptService = promptService;
    }

    /**
     * Lists all available local LLM models (managed by Ollama)
     */
    @SuppressWarnings("unchecked")
    public Mono<List<String>> listAvailableModels() {
        log.info("Fetching available local LLM models");
        
        return webClient.get()
                .uri("/api/tags")
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> {
                    try {
                        List<Map<String, Object>> models = (List<Map<String, Object>>) response.get("models");
                        if (models == null || models.isEmpty()) {
                            log.warn("No local models found");
                            return List.of(defaultModel);
                        }
                        List<String> modelNames = new ArrayList<>();
                        for (Map<String, Object> model : models) {
                            String name = (String) model.get("name");
                            if (name != null) {
                                modelNames.add(name);
                            }
                        }
                        log.info("Found {} local models: {}", modelNames.size(), modelNames);
                        return modelNames;
                    } catch (Exception e) {
                        log.error("Error parsing model list: {}", e.getMessage(), e);
                        return List.of(defaultModel);
                    }
                })
                .onErrorResume(error -> {
                    log.error("Error fetching local models: {}", error.getMessage(), error);
                    log.error("Error class: {}", error.getClass().getName());
                    return Mono.just(List.of(defaultModel));
                });
    }

    /**
     * Generates learning material using a local LLM model
     */
    public Mono<ClilResponse> generateMaterial(
            String modelName,
            String materialType,
            String topic,
            String userPrompt,
            String subject,
            String languageLevel,
            Integer vocabPercentage,
            String contentFocus,
            Boolean includeVocabList,
            String description) {

        // Validate required parameters
        if (modelName == null || modelName.trim().isEmpty()) {
            modelName = defaultModel;
            log.info("No model specified, using default: {}", defaultModel);
        }
        
        if (materialType == null || materialType.trim().isEmpty()) {
            return Mono.error(new IllegalArgumentException("Material type cannot be null or empty"));
        }
        if (topic == null || topic.trim().isEmpty()) {
            return Mono.error(new IllegalArgumentException("Topic cannot be null or empty"));
        }
        if (userPrompt == null || userPrompt.trim().isEmpty()) {
            return Mono.error(new IllegalArgumentException("User prompt cannot be null or empty"));
        }
        if (subject == null || subject.trim().isEmpty()) {
            return Mono.error(new IllegalArgumentException("Subject cannot be null or empty"));
        }

        // Set default values for optional parameters
        final String finalLanguageLevel = (languageLevel != null && !languageLevel.trim().isEmpty()) ? languageLevel : "B1";
        final Integer finalVocabPercentage = (vocabPercentage != null) ? vocabPercentage : 30;
        final String finalContentFocus = (contentFocus != null && !contentFocus.trim().isEmpty()) ? contentFocus : "balanced";
        final Boolean finalIncludeVocabList = (includeVocabList != null) ? includeVocabList : true;
        final String finalDescription = (description != null) ? description : "";
        final String finalModelName = modelName;

        // Get system prompt
        String systemPrompt = promptService.getTrainingPrompt();
        String enhancedUserPrompt = userPrompt +
                "\n\nIMPORTANT: Please format your response using proper HTML tags for better presentation. " +
                "Use headings (<h1>, <h2>, <h3>), paragraphs (<p>), lists (<ul>, <ol>, <li>), " +
                "emphasis (<strong>, <em>), and other appropriate HTML elements. " +
                "Please provide a well-structured HTML response that can be directly rendered in a web application.";

        // Create Ollama chat request
        OllamaChatRequest.Message systemMessage = OllamaChatRequest.Message.builder()
                .role("system")
                .content(systemPrompt)
                .build();

        OllamaChatRequest.Message userMessage = OllamaChatRequest.Message.builder()
                .role("user")
                .content(enhancedUserPrompt)
                .build();

        OllamaChatRequest.Options options = OllamaChatRequest.Options.builder()
                .temperature(0.7)
                .num_predict(2048)
                .top_p(0.9)
                .build();

        OllamaChatRequest request = OllamaChatRequest.builder()
                .model(finalModelName)
                .messages(List.of(systemMessage, userMessage))
                .stream(false)
                .options(options)
                .build();

        log.info("Generating material with local model: {}", finalModelName);

        // Call Ollama API
        return webClient.post()
                .uri("/api/chat")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(OllamaChatResponse.class)
                .flatMap(response -> {
                    if (response.getMessage() == null || response.getMessage().getContent() == null) {
                        return Mono.error(new IllegalStateException("No content returned from Ollama API."));
                    }
                    String aiContent = response.getMessage().getContent();

                    log.info("Successfully generated material with model: {}", finalModelName);

                    return Mono.just(ClilResponse.builder()
                            .formattedResponse(aiContent)
                            .build());
                })
                .onErrorResume(error -> {
                    String errorMessage;
                    if (error instanceof IllegalArgumentException) {
                        errorMessage = error.getMessage();
                    } else if (error instanceof IllegalStateException) {
                        errorMessage = "API Error: " + error.getMessage();
                    } else {
                        errorMessage = "Unexpected error occurred: " + error.getMessage();
                    }
                    log.error("Error generating material: {}", errorMessage);
                    return Mono.just(ClilResponse.builder()
                            .formattedResponse("<div class='error'><h3>Error generating content</h3><p>" +
                                    errorMessage + "</p></div>")
                            .build());
                });
    }
}
