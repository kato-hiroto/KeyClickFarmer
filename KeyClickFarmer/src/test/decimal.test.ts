import {assert} from "chai";

import Decimal from "../modules/decimal";

describe("test Decimal", () => {

    it("保存チェック", () => {
        const target = new Decimal("56781234567812345678");
        assert.equal(target.toNumbers()[0], 0);
        assert.equal(target.toNumbers()[1], 12345678);
        assert.equal(target.toNumbers()[2], 12345678);
        assert.equal(target.toNumbers()[3], 5678);
        assert.equal(target.toNumbers()[4], 0);
        assert.equal(target.toString(), "56781234567812345678");
    });

    it("保存チェック2", () => {
        const target = new Decimal("56781234567812345678.1234");
        assert.equal(target.toNumbers()[0], 12340000);
        assert.equal(target.toNumbers()[1], 12345678);
        assert.equal(target.toNumbers()[2], 12345678);
        assert.equal(target.toNumbers()[3], 5678);
        assert.equal(target.toNumbers()[4], 0);
        assert.equal(target.toString(), "56781234567812345678.1234");
    });
    
    it("保存チェック3", () => {
        const target = new Decimal("0.001234");
        assert.equal(target.toNumbers()[0], 123400);
    });
    
    it("足し算チェック", () => {
        const target1 = new Decimal("111111112222222233333333.4444");
        const target2 = new Decimal("111111112222222233333333.4444");
        const target3 = new Decimal("555555555555555555555555.5");
        const target4 = new Decimal("99999999999999999999999999999999");
        const other1 = new Decimal("111111111111111111111111");
        const other2 = new Decimal("0.11115");
        const other3 = new Decimal("444444444444444444444444.5");
        const other4 = new Decimal("1");
        assert.equal(target1.add(other1).toString(), "222222223333333344444444.4444");
        assert.equal(target2.add(other2).toString(), "111111112222222233333333.55555");
        assert.equal(target3.add(other3).toString(3), "1000000000000000000000000.000");
        assert.throws(() => target4.add(other4), RangeError);
    });

    it("引き算チェック", () => {
        const target1 = new Decimal("222222223333333344444444.4444");
        const target2 = new Decimal("111111112222222233333333.55555");
        const target3 = new Decimal("1000000000000000000000000");
        const target4 = new Decimal("999999999999999999999999");
        const other1 = new Decimal("111111111111111111111111");
        const other2 = new Decimal("0.11115");
        const other3 = new Decimal("444444444444444444444444.5");
        const other4 = new Decimal("1000000000000000000000000");
        assert.equal(target1.sub(other1).toString(2), "111111112222222233333333.44");
        assert.equal(target2.sub(other2).toString(), "111111112222222233333333.4444");
        assert.equal(target3.sub(other3).toString(), "555555555555555555555555.5");
        assert.throws(() => target4.sub(other4), RangeError);
    });
    
    it("かけ算チェック", () => {
        const target1 = new Decimal("111111111111111111111111");
        const target2 = new Decimal("111111111111111111111111");
        const target3 = new Decimal("111111111111111111111111");
        const other1 = 3;
        const other2 = 1.1;
        const other3 = 100;
        assert.equal(target1.mul(other1).toString(), "333333333333333333333333");
        assert.equal(target2.mul(other2).toString(), "122222222222222222222222.1");
        assert.equal(target3.mul(other3).toString(), "11111111111111111111111100");
    });
    
    it("割り算チェック", () => {
        const target1 = new Decimal("123456789123456789");
        const target2 = new Decimal("0.1");
        const target3 = new Decimal("12345.678");
        const other1 = 10;
        const other2 = 2;
        const other3 = 5;
        assert.equal(target1.divByPow10(other1).toString(), "12345678.91234567");
        assert.equal(target2.divByPow10(other2).toString(), "0.001");
        assert.equal(target3.divByPow10(other3).toString(), "0.12345678");
    });
    
    it("剰余チェック", () => {
        const target1 = new Decimal("123456789123456789");
        const target2 = new Decimal("0.1");
        const target3 = new Decimal("12345.678");
        const other1 = 9;
        const other2 = 10;
        const other3 = 4;
        assert.equal(target1.mod(other1).toString(), "0");
        assert.equal(target2.mod(other2).toString(), "0");
        assert.equal(target3.mod(other3).toString(), "1");
    });
    
    it("大小チェック", () => {
        const target1 = new Decimal("123456789123456789");
        const target2 = new Decimal("0.1");
        const target3 = new Decimal("12345.67");
        const other1 = 999999999999999999;
        const other2 = 0.01;
        const other3 = 12345.6700;
        assert.equal(target1.isBiggerThan(other1), false);
        assert.equal(target2.isBiggerThan(other2), true);
        assert.equal(target3.equal(other3), true);
    });
});

// public toNumbers(): Array<number> 
// public toString(decimalLength: number | undefined = undefined) : string 
// public add(affector: number | Decimal, destructive: Boolean = false): Decimal 
// public sub(affector: number | Decimal, destructive: Boolean = false): Decimal
// public mul(affector: number, destructive: Boolean = false): Decimal
// public divByPow10(n: number, destructive: Boolean = false): Decimal
// public mod(affector: number): number
// public equal(target: number | string | Decimal) 
// public isBiggerThan(target: number | string | Decimal, equal: Boolean = false): Boolean 
