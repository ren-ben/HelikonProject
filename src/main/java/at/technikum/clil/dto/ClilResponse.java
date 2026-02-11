package at.technikum.clil.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClilResponse {
    private String formattedResponse;

    @Builder.Default
    private List<Map<String, Object>> sources = new ArrayList<>();
}