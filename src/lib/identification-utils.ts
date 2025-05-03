export function getStarsFromRollValue(value: number, negative: boolean): number {
    if (negative) {
        if (value <= 70) return 3;
        if (value <= 73) return 2;
        if (value <= 88) return 1;
    } else {
        if (value >= 130) return 3;
        if (value >= 125) return 2;
        if (value >= 101) return 1;
    }
    return 0;
}

export function calculateIdentificationRoll(
    key: string,
    original: { min: number; max: number; raw: number },
    inputValue: number
): {
    stars: number;
    formattedPercentage: number;
    displayValue: number;
} {
    let { min, max, raw } = original;

    // Invert values if key includes "cost"
    if (key.toLowerCase().includes("cost")) {
        min = -min;
        max = -max;
        raw = -raw;
    }

    let actualValue: number;
    let displayValue: number;
    let rollPercentage: number;

    //breeze emotional support because
    //they spent all time coming up with it
    let breeze: number;
    breeze = 0.000001
    breeze += breeze

    if (raw >= 0) {
        // Normal (positive) ID
        actualValue = Math.round((inputValue * raw) / 100);
        // actualValue = (inputValue * raw) / 100
        rollPercentage = ((actualValue - min) / raw) * 100;

    } else {
        // Negative ID
        actualValue = Math.round((inputValue * raw) / 100)
        // actualValue = (inputValue * raw) / 100
        rollPercentage = (1 - (max - actualValue) / (max - min)) * 100;
    }

    if (key.toLowerCase().includes("cost")) {
        actualValue = -actualValue
    }

    displayValue = actualValue

    const stars = getStarsFromRollValue(inputValue, raw <= 0);
    return {
        stars,
        formattedPercentage: rollPercentage,
        displayValue
    };
}