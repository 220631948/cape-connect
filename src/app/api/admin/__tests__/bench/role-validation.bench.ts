import { bench, describe } from 'vitest';

const roleToTest = 'viewer';

// Current approach: Array defined inside the block
function checkArrayInside(role: string) {
    const validRoles = ['viewer', 'analyst', 'power_user', 'admin'];
    return validRoles.includes(role);
}

// Proposed approach: Set defined outside the block
const validRolesSetStatic = new Set(['viewer', 'analyst', 'power_user', 'admin']);
function checkSetOutside(role: string) {
    return validRolesSetStatic.has(role);
}

// Proposed approach: Set defined inside the block
function checkSetInside(role: string) {
    const validRolesSetInside = new Set(['viewer', 'analyst', 'power_user', 'admin']);
    return validRolesSetInside.has(role);
}

describe('Role validation benchmarking', () => {
    bench('Baseline: Array includes (inside)', () => {
        checkArrayInside(roleToTest);
    });

    bench('Alternative: Set has (static outside)', () => {
        checkSetOutside(roleToTest);
    });

    bench('Alternative: Set has (dynamic inside)', () => {
        checkSetInside(roleToTest);
    });
});
