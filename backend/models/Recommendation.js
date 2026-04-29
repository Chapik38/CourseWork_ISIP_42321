export class Recommendation {
  static describeBottleneck(type, score, replacement) {
    return { type, score, replacement, message: `${type.toUpperCase()} ограничивает итоговую производительность. Рекомендуется заменить на ${replacement?.name || 'более производительную модель'}.` };
  }
}
