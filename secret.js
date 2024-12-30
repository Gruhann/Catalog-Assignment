const fs = require('fs');

class SecretSharing {
    constructor() {
    
        this.MAX_256_BIT = BigInt('0x' + 'F'.repeat(64));
    }

    validateNumber(num) {
        if (num <= 0n) {
            throw new Error("All coefficients must be positive integers");
        }
        if (num > this.MAX_256_BIT) {
            throw new Error("Coefficient exceeds 256-bit range");
        }
        return true;
    }

    decodeYValue(base, value) {
        try {
            const decoded = BigInt(parseInt(value, parseInt(base)));
            this.validateNumber(decoded);
            return decoded;
        } catch (error) {
            throw new Error(`Failed to decode value ${value} with base ${base}: ${error.message}`);
        }
    }

    lagrangeInterpolation(xValues, yValues) {
        let c = 0n;
        
        for (let i = 0; i < xValues.length; i++) {
            let term = yValues[i];
            
            for (let j = 0; j < xValues.length; j++) {
                if (i !== j) {
                    const xi = BigInt(xValues[i]);
                    const xj = BigInt(xValues[j]);
                    const numerator = 0n - xj;
                    const denominator = xi - xj;
                    if (denominator === 0n) {
                        throw new Error("Invalid x values - division by zero");
                    }
                    
                    term = term * numerator / denominator;
                }
            }
            c = c + term;
        }
        this.validateNumber(c);
        return c;
    }

    processTestCase(data) {
        const n = data.keys.n;
        const k = data.keys.k;
        if (n < k) {
            throw new Error(`Invalid input: n (${n}) must be greater than or equal to k (${k})`);
        }
        
        const xValues = [];
        const yValues = [];
        for (const key in data) {
            if (key !== 'keys' && !isNaN(key)) {
                const base = data[key].base;
                const value = data[key].value;
                const x = parseInt(key);
                const y = this.decodeYValue(base, value);
                xValues.push(x);
                yValues.push(y);
            }
        }
        
        if (xValues.length < k) {
            throw new Error(`Not enough roots provided. Need ${k}, got ${xValues.length}`);
        }
        
        const secret = this.lagrangeInterpolation(
            xValues.slice(0, k), 
            yValues.slice(0, k)
        );
        
        return secret;
    }

    processAllTestCases(filePaths) {
        const results = [];
        
        for (const [index, filePath] of filePaths.entries()) {
            try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const secret = this.processTestCase(data);
                results.push(`Test Case ${index + 1} Secret (c): ${secret}`);
            } catch (error) {
                results.push(`Test Case ${index + 1} Error: ${error.message}`);
            }
        }
        
        return results;
    }
}

function main() {
    const testCases = ['./testcase1.json', './testcase2.json'];
    const solver = new SecretSharing();
    const results = solver.processAllTestCases(testCases);
    console.log(results.join('\n'));
}

main();