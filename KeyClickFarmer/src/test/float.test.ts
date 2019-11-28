import {assert} from "chai";

import Float from "../modules/float";

describe("test Decimal", () => {

    it("保存チェック1", () => {
        const target = new Float("123456781234.5678");
        assert.equal(target.parseNumbers()[0], 12345678);
    });
    
    it("保存チェック2", () => {
        const target = new Float("123456781234.5678");
        assert.equal(target.parseNumbers()[1], 12345678);
    });
    
    it("保存チェック3", () => {
        const target = new Float("123456781234.5678");
        assert.equal(target.dotPos, 12);
    });
    
    it("String変換チェック1", () => {
        const target = new Float("123456781234.5678");
        assert.equal(target.parseString(), "123456781234.5678");
    });
    
    it("String変換チェック2", () => {
        const target = new Float("-55555555");
        assert.equal(target.parseString(), "-1*10^8+44444445");
    });
    
    it("String変換チェック3", () => {
        const target = new Float("-1*10^8+44444445");
        assert.equal(target.parseNumbers()[1], -1);
    });


});

// public parseNumbers(): Array<number>
// public parseString(): string
// public parseInteger(): number
// public fixIntValues()
// public simpleCalculation(affector: number | string | Float, mode: Mode, destructive: Boolean = false): Float
// public complexMultiply(affector: number | string | Float, destructive: Boolean = false): Float
// public mod(affector: number): number{
// public isBiggerThan(target: number | string | Float, equal: Boolean = false): Boolean

