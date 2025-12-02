package at.technikum.clil.service;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Service
public class PromptService {
    private final ResourceLoader resourceLoader;
    @Getter
    private String trainingPrompt;

    public PromptService(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    @PostConstruct
    public void init() throws IOException {
        Resource resource = resourceLoader.getResource("classpath:prompts/bloom-taxonomy-prompt.txt");
        this.trainingPrompt = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
    }

}