/**
 * SM-2 Spaced Repetition Algorithm Tests
 *
 * The SM-2 algorithm calculates:
 * - Ease Factor (EF): Difficulty multiplier (minimum 1.3)
 * - Interval: Days until next review
 *
 * Quality ratings:
 * - 0: Complete blackout
 * - 1: Incorrect, but remembered something
 * - 2: Incorrect, but felt close
 * - 3: Correct with difficulty
 * - 4: Correct with hesitation
 * - 5: Perfect response
 */

// SM-2 Algorithm implementation (extracted for testing)
function calculateSM2(
  quality: number,
  easeFactor: number,
  interval: number,
  reviewCount: number
): {
  easeFactor: number;
  interval: number;
  reviewCount: number;
  status: 'new' | 'learning' | 'review' | 'learned';
} {
  let newEF = easeFactor;
  let newInterval = interval;
  let newReviewCount = reviewCount + 1;
  let newStatus: 'new' | 'learning' | 'review' | 'learned' = 'learning';

  if (quality >= 3) {
    // Correct response
    if (interval === 0) {
      newInterval = 1;
    } else if (interval === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }

    // Update ease factor
    newEF = Math.max(
      1.3,
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );

    // Update status
    if (newReviewCount >= 5 && quality >= 4) {
      newStatus = 'learned';
    } else if (newReviewCount >= 2) {
      newStatus = 'review';
    } else {
      newStatus = 'learning';
    }
  } else {
    // Incorrect response
    newInterval = 0;
    newStatus = 'learning';
  }

  return {
    easeFactor: newEF,
    interval: newInterval,
    reviewCount: newReviewCount,
    status: newStatus,
  };
}

describe('SM-2 Algorithm', () => {
  describe('First review (interval = 0)', () => {
    it('should set interval to 1 on first correct response', () => {
      const result = calculateSM2(3, 2.5, 0, 0);
      
      expect(result.interval).toBe(1);
      expect(result.reviewCount).toBe(1);
      expect(result.status).toBe('learning');
    });

    it('should reset interval on incorrect response', () => {
      const result = calculateSM2(2, 2.5, 0, 0);
      
      expect(result.interval).toBe(0);
      expect(result.status).toBe('learning');
    });
  });

  describe('Second review (interval = 1)', () => {
    it('should set interval to 6 on correct response', () => {
      const result = calculateSM2(4, 2.5, 1, 1);
      
      expect(result.interval).toBe(6);
      expect(result.reviewCount).toBe(2);
      expect(result.status).toBe('review');
    });

    it('should reset interval on incorrect response', () => {
      const result = calculateSM2(1, 2.5, 1, 1);
      
      expect(result.interval).toBe(0);
      expect(result.status).toBe('learning');
    });
  });

  describe('Subsequent reviews (interval > 1)', () => {
    it('should multiply interval by ease factor', () => {
      const result = calculateSM2(4, 2.5, 6, 2);
      
      expect(result.interval).toBe(15); // round(6 * 2.5)
      expect(result.status).toBe('review');
    });

    it('should calculate longer intervals over time', () => {
      let state = { ef: 2.5, interval: 6, reviews: 2 };
      
      // Review 3
      let result = calculateSM2(4, state.ef, state.interval, state.reviews);
      expect(result.interval).toBe(15);
      state = { ef: result.easeFactor, interval: result.interval, reviews: result.reviewCount };
      
      // Review 4
      result = calculateSM2(4, state.ef, state.interval, state.reviews);
      expect(result.interval).toBe(38); // round(15 * 2.5)
    });
  });

  describe('Ease factor adjustments', () => {
    it('should increase ease factor for quality 5', () => {
      const result = calculateSM2(5, 2.5, 0, 0);
      
      expect(result.easeFactor).toBeGreaterThan(2.5);
      expect(result.easeFactor).toBeCloseTo(2.6, 1);
    });

    it('should maintain ease factor for quality 4', () => {
      const result = calculateSM2(4, 2.5, 0, 0);
      
      expect(result.easeFactor).toBeCloseTo(2.5, 1);
    });

    it('should decrease ease factor for quality 3', () => {
      const result = calculateSM2(3, 2.5, 0, 0);
      
      expect(result.easeFactor).toBeLessThan(2.5);
      expect(result.easeFactor).toBeCloseTo(2.36, 1);
    });

    it('should never go below 1.3', () => {
      // Multiple incorrect responses
      let ef = 2.5;
      for (let i = 0; i < 10; i++) {
        const result = calculateSM2(3, ef, 0, 0);
        ef = result.easeFactor;
      }
      
      expect(ef).toBeGreaterThanOrEqual(1.3);
    });

    it('should not update ease factor on incorrect response', () => {
      const result = calculateSM2(2, 2.5, 6, 3);
      
      // Ease factor should remain the same on failure
      expect(result.easeFactor).toBe(2.5);
    });
  });

  describe('Status transitions', () => {
    it('should be "learning" on first review', () => {
      const result = calculateSM2(4, 2.5, 0, 0);
      
      expect(result.status).toBe('learning');
    });

    it('should be "review" after 2+ reviews', () => {
      const result = calculateSM2(4, 2.5, 1, 1);
      
      expect(result.status).toBe('review');
    });

    it('should be "learned" after 5+ reviews with quality >= 4', () => {
      const result = calculateSM2(4, 2.5, 38, 4);
      
      expect(result.status).toBe('learned');
    });

    it('should stay "review" after 5+ reviews with quality 3', () => {
      const result = calculateSM2(3, 2.5, 38, 4);
      
      expect(result.status).toBe('review');
    });

    it('should reset to "learning" on incorrect response', () => {
      const result = calculateSM2(2, 2.5, 38, 4);
      
      expect(result.status).toBe('learning');
    });
  });

  describe('Quality edge cases', () => {
    it('should handle quality 0 (complete blackout)', () => {
      const result = calculateSM2(0, 2.5, 10, 3);
      
      expect(result.interval).toBe(0);
      expect(result.status).toBe('learning');
    });

    it('should handle quality 5 (perfect)', () => {
      const result = calculateSM2(5, 2.5, 6, 2);
      
      expect(result.easeFactor).toBeCloseTo(2.6, 1);
      expect(result.interval).toBe(15);
    });
  });

  describe('Long-term progression', () => {
    it('should show increasing intervals with consistent quality 4', () => {
      const intervals: number[] = [];
      let ef = 2.5;
      let interval = 0;
      let reviews = 0;

      for (let i = 0; i < 10; i++) {
        const result = calculateSM2(4, ef, interval, reviews);
        intervals.push(result.interval);
        ef = result.easeFactor;
        interval = result.interval;
        reviews = result.reviewCount;
      }

      // Each interval should be >= previous (with possible reset)
      for (let i = 1; i < intervals.length; i++) {
        if (intervals[i] > 0) {
          expect(intervals[i]).toBeGreaterThanOrEqual(intervals[i - 1]);
        }
      }

      // Final interval should be significant
      expect(intervals[intervals.length - 1]).toBeGreaterThan(100);
    });

    it('should eventually reach "learned" status', () => {
      let ef = 2.5;
      let interval = 0;
      let reviews = 0;
      let status = 'new';

      for (let i = 0; i < 10 && status !== 'learned'; i++) {
        const result = calculateSM2(4, ef, interval, reviews);
        ef = result.easeFactor;
        interval = result.interval;
        reviews = result.reviewCount;
        status = result.status;
      }

      expect(status).toBe('learned');
    });
  });

  describe('Grading button mappings', () => {
    // Map our button labels to SM-2 quality
    const gradeMap = {
      'Again': 1,
      'Hard': 2,
      'Good': 3,
      'Easy': 5,
    };

    it('should handle "Again" grade', () => {
      const result = calculateSM2(gradeMap['Again'], 2.5, 10, 3);
      
      expect(result.interval).toBe(0); // Reset
      expect(result.status).toBe('learning');
    });

    it('should handle "Hard" grade', () => {
      const result = calculateSM2(gradeMap['Hard'], 2.5, 10, 3);
      
      expect(result.interval).toBe(0); // Reset
      expect(result.status).toBe('learning');
    });

    it('should handle "Good" grade', () => {
      const result = calculateSM2(gradeMap['Good'], 2.5, 6, 2);
      
      expect(result.interval).toBe(15); // Continue
      expect(result.easeFactor).toBeLessThan(2.5); // Slightly decrease
    });

    it('should handle "Easy" grade', () => {
      const result = calculateSM2(gradeMap['Easy'], 2.5, 6, 2);
      
      expect(result.interval).toBe(15); // Continue
      expect(result.easeFactor).toBeGreaterThan(2.5); // Increase
    });
  });
});
