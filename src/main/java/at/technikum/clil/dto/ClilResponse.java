package at.technikum.clil.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ClilResponse {
    private String formattedResponse;
//    private String rawResponse;
}