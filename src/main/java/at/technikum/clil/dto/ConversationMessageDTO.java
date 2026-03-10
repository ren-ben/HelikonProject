package at.technikum.clil.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationMessageDTO {
    private Long id;
    private String role;
    private String message;
    private LocalDateTime timestamp;
    private String modelUsed;
}
