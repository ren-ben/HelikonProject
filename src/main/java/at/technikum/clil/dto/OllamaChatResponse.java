package at.technikum.clil.dto;

import lombok.Data;

@Data
public class OllamaChatResponse {
    private String model;
    private String created_at;
    private Message message;
    private Boolean done;
    private Long total_duration;
    private Long load_duration;
    private Integer prompt_eval_count;
    private Long prompt_eval_duration;
    private Integer eval_count;
    private Long eval_duration;

    @Data
    public static class Message {
        private String role;
        private String content;
    }
}
