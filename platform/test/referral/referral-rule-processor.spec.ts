import { describe, it } from '@tcom/test';
import { instance, mock, reset, when, deepEqual, anything, verify } from '@tcom/test/mock';
import { Referral, ReferralRuleManager, ReferralRuleProcessor, ReferralEventType, ReferralRule, ReferralRuleActionType, ReferralTarget } from '../../src/referral';
import { ReferralRuleMatcherFactory, ReferralRuleMatcher, ReferralRuleActionProcessorFactory, ReferralRuleActionProcessor } from '../../src/referral/rules';
import { ReferralRuleActionContext } from '../../src/referral/rules/referral-rule-action-context';

const rules: ReferralRule[] = [
    {
        id: 1,
        event: ReferralEventType.SignUp,
        count: 10,
        every: true,
        actions: [
            {
                id: 1,
                ruleId: 1,
                type: ReferralRuleActionType.AwardDiamonds,
                amount: 100,
                target: ReferralTarget.Referrer,
                enabled: true,
                createTime: new Date(),
                updateTime: new Date()
            }
        ],
        groupId: 1,
        order: 2,
        enabled: true,
        createTime: new Date(),
        updateTime: new Date()
    },
    {
        id: 2,
        event: ReferralEventType.SignUp,
        count: 100,
        actions: [
            {
                id: 2,
                ruleId: 2,
                type: ReferralRuleActionType.AwardDiamonds,
                amount: 100,
                enabled: true,
                target: ReferralTarget.Referee,
                createTime: new Date(),
                updateTime: new Date()
            },
            {
                id: 3,
                ruleId: 2,
                type: ReferralRuleActionType.ChangeGroup,
                groupId: 2,
                target: ReferralTarget.Referrer,
                enabled: true,
                createTime: new Date(),
                updateTime: new Date()
            }
        ],
        groupId: 1,
        order: 1,
        enabled: true,
        createTime: new Date(),
        updateTime: new Date()
    }
];

describe('ReferralCommissionProcessor', () => {
    const mockReferralRuleManager = mock(ReferralRuleManager);
    const mockReferralRuleMatcherFactory = mock(ReferralRuleMatcherFactory);
    const mockReferralRuleActionProcessorFactory = mock(ReferralRuleActionProcessorFactory);

    function getProcessor(): ReferralRuleProcessor {
        return new ReferralRuleProcessor(
            instance(mockReferralRuleManager),
            instance(mockReferralRuleMatcherFactory),
            instance(mockReferralRuleActionProcessorFactory)
        );
    }

    beforeEach(() => {
        reset(mockReferralRuleManager);
        reset(mockReferralRuleMatcherFactory);
        reset(mockReferralRuleActionProcessorFactory);
    });

    describe('process()', () => {
        it('should do nothing if referrer is not active', async () => {
            // Given
            const event = ReferralEventType.SignUp;

            const referral: Referral = {
                id: 1,
                revenue: 100,
                rewardCount: 0,
                diamondCount: 0,
                referrer: {
                    userId: 1,
                    groupId: 1,
                    active: false,
                    code: 'ABC1234',
                    referralCount: 100,
                    rewardCount: 0,
                    revenue: 100,
                    diamondCount: 0,
                    slug: 'abc',
                    createTime: new Date(),
                    updateTime: new Date()
                },
                referee: {
                    userId: 2,
                    groupId: 1,
                    active: true,
                    code: '1234ABC',
                    referralCount: 0,
                    rewardCount: 0,
                    diamondCount: 0,
                    revenue: 0,
                    slug: 'abc',
                    createTime: new Date(),
                    updateTime: new Date()
                },
                createTime: new Date(),
                updateTime: new Date()
            };

            when(mockReferralRuleManager.getAll(deepEqual({ event, groupId: referral.referrer.groupId, enabled: true }))).thenResolve(rules);

            const processor = getProcessor();

            // When
            await processor.process(event, referral);

            // Then
            verify(mockReferralRuleManager.getAll(anything())).never();
            verify(mockReferralRuleMatcherFactory.create(event)).never();
            verify(mockReferralRuleActionProcessorFactory.create(anything())).never();
        });

        it('should do nothing if no rules are set', async () => {
            // Given
            const event = ReferralEventType.SignUp;

            const referral: Referral = {
                id: 1,
                revenue: 100,
                rewardCount: 0,
                diamondCount: 0,
                referrer: {
                    userId: 1,
                    groupId: 1,
                    active: true,
                    code: 'ABC1234',
                    referralCount: 100,
                    rewardCount: 0,
                    revenue: 100,
                    diamondCount: 0,
                    slug: 'abc',
                    createTime: new Date(),
                    updateTime: new Date()
                },
                referee: {
                    userId: 2,
                    groupId: 1,
                    active: true,
                    code: '1234ABC',
                    referralCount: 0,
                    rewardCount: 0,
                    revenue: 0,
                    diamondCount: 0,
                    slug: 'abc',
                    createTime: new Date(),
                    updateTime: new Date()
                },
                createTime: new Date(),
                updateTime: new Date()
            };

            when(mockReferralRuleManager.getAll(deepEqual({ event, groupId: referral.referrer.groupId, enabled: true }))).thenResolve([]);

            const processor = getProcessor();

            // When
            await processor.process(event, referral);

            // Then
            verify(mockReferralRuleManager.getAll(anything())).once();
            verify(mockReferralRuleMatcherFactory.create(event)).never();
            verify(mockReferralRuleActionProcessorFactory.create(anything())).never();
        });

        it('should do nothing if no rule is matched', async () => {
            // Given
            const event = ReferralEventType.SignUp;

            const referral: Referral = {
                id: 1,
                revenue: 100,
                rewardCount: 0,
                diamondCount: 0,
                referrer: {
                    userId: 1,
                    groupId: 1,
                    active: true,
                    code: 'ABC1234',
                    referralCount: 100,
                    rewardCount: 0,
                    revenue: 100,
                    diamondCount: 0,
                    slug: 'abc',
                    createTime: new Date(),
                    updateTime: new Date()
                },
                referee: {
                    userId: 2,
                    groupId: 1,
                    active: true,
                    code: '1234ABC',
                    referralCount: 0,
                    rewardCount: 0,
                    revenue: 0,
                    diamondCount: 0,
                    slug: 'abc',
                    createTime: new Date(),
                    updateTime: new Date()
                },
                createTime: new Date(),
                updateTime: new Date()
            };

            const mockMatcher = mock<ReferralRuleMatcher>();
            when(mockMatcher.match(anything(), referral, undefined)).thenResolve(false);

            when(mockReferralRuleManager.getAll(deepEqual({ event, groupId: referral.referrer.groupId, enabled: true }))).thenResolve(rules);
            when(mockReferralRuleMatcherFactory.create(event)).thenReturn(instance(mockMatcher));

            const processor = getProcessor();

            // When
            await processor.process(event, referral);

            // Then
            verify(mockReferralRuleManager.getAll(anything())).once();
            verify(mockReferralRuleMatcherFactory.create(event)).once();
            verify(mockReferralRuleActionProcessorFactory.create(anything())).never();
        });

        it('should do nothing if no rule actions are enabled', async () => {
            // Given
            const event = ReferralEventType.SignUp;

            const rulesWithDisabledActions: ReferralRule[] = [
                    {
                    id: 1,
                    event: ReferralEventType.SignUp,
                    count: 100,
                    actions: [
                        {
                            id: 1,
                            ruleId: 1,
                            type: ReferralRuleActionType.AwardDiamonds,
                            amount: 100,
                            enabled: false,
                            target: ReferralTarget.Referrer,
                            createTime: new Date(),
                            updateTime: new Date()
                        },
                        {
                            id: 2,
                            ruleId: 1,
                            type: ReferralRuleActionType.ChangeGroup,
                            groupId: 2,
                            target: ReferralTarget.Referrer,
                            enabled: false,
                            createTime: new Date(),
                            updateTime: new Date()
                        }
                    ],
                    groupId: 1,
                    order: 1,
                    enabled: true,
                    createTime: new Date(),
                    updateTime: new Date()
                }
            ];

            const referral: Referral = {
                id: 1,
                revenue: 100,
                rewardCount: 0,
                diamondCount: 0,
                referrer: {
                    userId: 1,
                    groupId: 1,
                    active: true,
                    code: 'ABC1234',
                    referralCount: 100,
                    rewardCount: 0,
                    revenue: 100,
                    diamondCount: 0,
                    slug: 'abc',
                    createTime: new Date(),
                    updateTime: new Date()
                },
                referee: {
                    userId: 2,
                    groupId: 1,
                    active: true,
                    code: '1234ABC',
                    referralCount: 0,
                    rewardCount: 0,
                    revenue: 0,
                    diamondCount: 0,
                    slug: 'abc',
                    createTime: new Date(),
                    updateTime: new Date()
                },
                createTime: new Date(),
                updateTime: new Date()
            };

            const mockMatcher = mock<ReferralRuleMatcher>();
            when(mockMatcher.match(rules[0], referral, undefined)).thenResolve(true);

            when(mockReferralRuleManager.getAll(deepEqual({ event, groupId: referral.referrer.groupId, enabled: true }))).thenResolve(rulesWithDisabledActions);
            when(mockReferralRuleMatcherFactory.create(event)).thenReturn(instance(mockMatcher));

            const processor = getProcessor();

            // When
            await processor.process(event, referral);

            // Then
            verify(mockReferralRuleManager.getAll(anything())).once();
            verify(mockReferralRuleMatcherFactory.create(event)).once();
            verify(mockReferralRuleActionProcessorFactory.create(anything())).never();
        });

        it('should match rule and actions processed', async () => {
            // Given
            const event = ReferralEventType.SignUp;

            const referral: Referral = {
                id: 1,
                revenue: 100,
                rewardCount: 0,
                diamondCount: 0,
                referrer: {
                    userId: 1,
                    groupId: 1,
                    active: true,
                    code: 'ABC1234',
                    referralCount: 100,
                    rewardCount: 0,
                    revenue: 100,
                    diamondCount: 0,
                    slug: 'abc',
                    createTime: new Date(),
                    updateTime: new Date()
                },
                referee: {
                    userId: 2,
                    groupId: 1,
                    active: true,
                    code: '1234ABC',
                    referralCount: 0,
                    rewardCount: 0,
                    revenue: 0,
                    diamondCount: 0,
                    slug: 'abc',
                    createTime: new Date(),
                    updateTime: new Date()
                },
                createTime: new Date(),
                updateTime: new Date()
            };

            const rule = rules[1];
            const context: ReferralRuleActionContext = {
                referral,
                rule
            };

            const mockMatcher = mock<ReferralRuleMatcher>();
            when(mockMatcher.match(rule, referral, undefined)).thenResolve(true);

            const mockActionProcessor = mock<ReferralRuleActionProcessor>();
            when(mockReferralRuleManager.getAll(deepEqual({ event, groupId: referral.referrer.groupId, enabled: true }))).thenResolve(rules);
            when(mockReferralRuleMatcherFactory.create(event)).thenReturn(instance(mockMatcher));
            when(mockReferralRuleActionProcessorFactory.create(rule.actions[0].type)).thenReturn(instance(mockActionProcessor));
            when(mockReferralRuleActionProcessorFactory.create(rule.actions[1].type)).thenReturn(instance(mockActionProcessor));

            const processor = getProcessor();

            // When
            await processor.process(event, referral);

            // Then
            verify(mockReferralRuleManager.getAll(anything())).once();
            verify(mockReferralRuleMatcherFactory.create(event)).once();
            verify(mockReferralRuleActionProcessorFactory.create(rule.actions[0].type)).once();
            verify(mockReferralRuleActionProcessorFactory.create(rule.actions[1].type)).once();
            verify(mockActionProcessor.process(rule.actions[0], deepEqual(context), undefined)).once();
            verify(mockActionProcessor.process(rule.actions[1], deepEqual(context), undefined)).once();
        });
    });
});