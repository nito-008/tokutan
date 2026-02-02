import { nanoid } from "nanoid";

/**
 * Requirement用のIDを生成
 * @returns requ_[nanoid] 形式のID
 */
export const generateRequirementId = () => `requ_${nanoid()}`;

/**
 * Category用のIDを生成
 * @returns ctgy_[nanoid] 形式のID
 */
export const generateCategoryId = () => `ctgy_${nanoid()}`;

/**
 * SubCategory用のIDを生成
 * @returns sbct_[nanoid] 形式のID
 */
export const generateSubcategoryId = () => `sbct_${nanoid()}`;

/**
 * Group用のIDを生成
 * @returns grup_[nanoid] 形式のID
 */
export const generateGroupId = () => `grup_${nanoid()}`;
