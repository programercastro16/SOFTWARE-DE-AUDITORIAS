class AuditItemDTO {
  static toResponse(item) {
    if (!item) return null;

    return {
      id: item.id,
      audit_id: item.audit_id,
      code: item.code,
      label: item.label,
      weight: item.weight,
      score: item.score,
      category: item.category,
      observations: item.observations,
      created_at: item.created_at,
      updated_at: item.updated_at
    };
  }

  static toDetailedResponse(item) {
    if (!item) return null;

    return {
      id: item.id,
      audit_id: item.audit_id,
      code: item.code,
      label: item.label,
      weight: item.weight,
      score: item.score,
      category: item.category,
      observations: item.observations,
      created_at: item.created_at,
      updated_at: item.updated_at,
      score_display: this.getScoreDisplay(item.score),
      score_color: this.getScoreColor(item.score),
      weight_percentage: this.calculateWeightPercentage(item.weight),
      weighted_score: this.calculateWeightedScore(item.score, item.weight),
      is_critical: this.isCriticalItem(item.score),
      needs_attention: this.needsAttention(item.score),
      status: this.getItemStatus(item.score)
    };
  }

  static toListResponse(items) {
    if (!Array.isArray(items)) return [];

    return items.map(item => this.toDetailedResponse(item));
  }

  static toCategoryResponse(items) {
    if (!Array.isArray(items)) return [];

    const groupedByCategory = items.reduce((groups, item) => {
      const category = item.category || 'Sin categoría';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(this.toDetailedResponse(item));
      return groups;
    }, {});

    return Object.keys(groupedByCategory).map(category => ({
      category,
      items: groupedByCategory[category],
      total_items: groupedByCategory[category].length,
      average_score: this.calculateCategoryAverage(groupedByCategory[category]),
      total_weight: groupedByCategory[category].reduce((sum, item) => sum + item.weight, 0),
      critical_count: groupedByCategory[category].filter(item => item.is_critical).length
    }));
  }

  static toUpdateResponse(updatedItems) {
    if (!Array.isArray(updatedItems)) return null;

    return {
      updated_items: updatedItems.length,
      items: updatedItems.map(item => ({
        id: item.id,
        code: item.code,
        score: item.score,
        score_display: this.getScoreDisplay(item.score),
        status: this.getItemStatus(item.score)
      })),
      message: 'Items actualizados exitosamente'
    };
  }

  static toSummaryResponse(summary) {
    if (!summary) return null;

    return {
      total_items: summary.total_items || 0,
      total_weight: summary.total_weight || 0,
      weighted_score: summary.weighted_score || 0,
      average_score: Math.round(summary.average_score || 0),
      concept: this.calculateConcept(summary.average_score || 0),
      by_status: {
        favorable: summary.favorable_count || 0,
        favorable_requirement: summary.favorable_requirement_count || 0,
        unfavorable: summary.unfavorable_count || 0
      },
      completion_percentage: this.calculateCompletionPercentage(summary),
      critical_items_count: summary.unfavorable_count || 0,
      needs_improvement_count: summary.favorable_requirement_count || 0
    };
  }

  static toScoreByCategoryResponse(scores) {
    if (!Array.isArray(scores)) return [];

    return scores.map(score => ({
      category: score.category,
      item_count: score.item_count || 0,
      total_weight: score.total_weight || 0,
      average_score: Math.round(score.average_score || 0),
      weighted_score: Math.round(score.weighted_score || 0),
      concept: this.calculateConcept(score.average_score || 0),
      status_display: this.getScoreDisplay(score.average_score || 0),
      status_color: this.getScoreColor(score.average_score || 0)
    }));
  }

  static toCriticalItemsResponse(items) {
    if (!Array.isArray(items)) return [];

    return {
      critical_items: items.map(item => ({
        id: item.id,
        code: item.code,
        label: item.label,
        score: item.score,
        category: item.category,
        observations: item.observations,
        urgency_level: this.getUrgencyLevel(item.score),
        recommended_action: this.getRecommendedAction(item.score)
      })),
      total_critical: items.length,
      message: 'Se encontraron items críticos que requieren atención inmediata'
    };
  }

  static getScoreDisplay(score) {
    if (score >= 90) return 'Excelente';
    if (score >= 80) return 'Bueno';
    if (score >= 60) return 'Regular';
    if (score >= 40) return 'Deficiente';
    return 'Crítico';
  }

  static getScoreColor(score) {
    if (score >= 90) return '#28a745';
    if (score >= 80) return '#17a2b8';
    if (score >= 60) return '#ffc107';
    if (score >= 40) return '#fd7e14';
    return '#dc3545';
  }

  static calculateWeightPercentage(weight) {
    const totalWeight = 100; // Peso total base
    return Math.round((weight / totalWeight) * 100);
  }

  static calculateWeightedScore(score, weight) {
    return Math.round((score * weight) / 100);
  }

  static isCriticalItem(score) {
    return score < 60;
  }

  static needsAttention(score) {
    return score < 80;
  }

  static getItemStatus(score) {
    if (score >= 90) return 'EXCELLENTE';
    if (score >= 80) return 'BUENO';
    if (score >= 60) return 'REGULAR';
    if (score >= 40) return 'DEFICIENTE';
    return 'CRITICO';
  }

  static calculateCategoryAverage(items) {
    if (!Array.isArray(items) || items.length === 0) return 0;

    const totalScore = items.reduce((sum, item) => sum + item.score, 0);
    return Math.round(totalScore / items.length);
  }

  static calculateConcept(averageScore) {
    if (averageScore >= 90) return 'Favorable';
    if (averageScore >= 60) return 'Favorable con requerimiento';
    return 'Desfavorable';
  }

  static calculateCompletionPercentage(summary) {
    if (!summary || summary.total_items === 0) return 0;

    const scoredItems = (summary.favorable_count || 0) + 
                       (summary.favorable_requirement_count || 0) + 
                       (summary.unfavorable_count || 0);

    return Math.round((scoredItems / summary.total_items) * 100);
  }

  static getUrgencyLevel(score) {
    if (score < 40) return 'ALTA';
    if (score < 60) return 'MEDIA';
    return 'BAJA';
  }

  static getRecommendedAction(score) {
    if (score < 40) return 'Acción correctiva inmediata requerida';
    if (score < 60) return 'Plan de mejora necesario';
    if (score < 80) return 'Monitoreo y seguimiento recomendado';
    return 'Mantener estándares actuales';
  }

  static sanitizeItemData(itemData) {
    if (!itemData) return {};

    return {
      code: itemData.code?.trim() || '',
      score: Math.max(0, Math.min(100, parseInt(itemData.score) || 0)),
      observations: itemData.observations?.trim() || null
    };
  }

  static validateItemData(itemData) {
    const errors = [];

    if (!itemData.code || itemData.code.trim().length === 0) {
      errors.push('El código del item es requerido');
    }

    if (itemData.score === undefined || itemData.score === null) {
      errors.push('El puntaje es requerido');
    } else if (itemData.score < 0 || itemData.score > 100) {
      errors.push('El puntaje debe estar entre 0 y 100');
    }

    return errors;
  }

  static validateBulkItems(items) {
    const errors = [];

    if (!Array.isArray(items)) {
      errors.push('Los items deben ser un array');
      return errors;
    }

    if (items.length === 0) {
      errors.push('Debe proporcionar al menos un item');
      return errors;
    }

    items.forEach((item, index) => {
      const itemErrors = this.validateItemData(item);
      if (itemErrors.length > 0) {
        errors.push(`Item ${index + 1}: ${itemErrors.join(', ')}`);
      }
    });

    return errors;
  }

  static groupItemsByCode(items) {
    if (!Array.isArray(items)) return {};

    return items.reduce((groups, item) => {
      const code = item.code || 'unknown';
      if (!groups[code]) {
        groups[code] = [];
      }
      groups[code].push(item);
      return groups;
    }, {});
  }

  static filterItemsByScoreRange(items, minScore = 0, maxScore = 100) {
    if (!Array.isArray(items)) return [];

    return items.filter(item => 
      item.score >= minScore && item.score <= maxScore
    );
  }

  static filterItemsByCategory(items, category) {
    if (!Array.isArray(items) || !category) return [];

    return items.filter(item => 
      item.category === category
    );
  }
}

module.exports = AuditItemDTO;
