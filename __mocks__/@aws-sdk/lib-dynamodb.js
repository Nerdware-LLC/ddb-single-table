import { mockClient } from "aws-sdk-client-mock";
const MOCK_DATES = {
    JAN_1_2020: new Date("2020-01-01T00:00:00.000Z"),
    JAN_2_2020: new Date("2020-01-02T00:00:00.000Z"),
    JAN_3_2020: new Date("2020-01-03T00:00:00.000Z"),
};
const MOCK_USERS = {
    USER_A: {
        id: "USER#A",
        sk: "#DATA#USER#A",
        handle: "@user_A",
        email: "userA@gmail.com",
        phone: "(888) 111-1111",
        profile: {
            displayName: "Mock McHumanPerson",
            businessName: "Definitely Not a Penguin in a Human Costume, LLC",
            photoUrl: "s3://mock-bucket-name/path/to/human/photo.jpg",
        },
        createdAt: MOCK_DATES.JAN_1_2020,
        updatedAt: MOCK_DATES.JAN_1_2020,
    },
    USER_B: {
        id: "USER#B",
        sk: "#DATA#USER#B",
        handle: "@user_B",
        email: "user_B@gmail.com",
        phone: "(888) 222-2222",
        profile: {
            displayName: "Rick Sanchez",
            businessName: "Science Inc.",
            photoUrl: "s3://mock-bucket-name/path/to/ricks/photo.jpg",
        },
        createdAt: MOCK_DATES.JAN_2_2020,
        updatedAt: MOCK_DATES.JAN_2_2020,
    },
    USER_C: {
        id: "USER#C",
        sk: "#DATA#USER#C",
        handle: "@user_C",
        email: "user_C@gmail.com",
        phone: "(888) 333-3333",
        profile: {
            displayName: "@user_C",
            businessName: null,
            photoUrl: null,
        },
        createdAt: MOCK_DATES.JAN_3_2020,
        updatedAt: MOCK_DATES.JAN_3_2020,
    },
};
const { DynamoDBDocumentClient: _DynamoDBDocumentClient, GetCommand, BatchGetCommand, PutCommand, BatchWriteCommand, UpdateCommand, DeleteCommand, QueryCommand, ScanCommand, } = await vi.importActual("@aws-sdk/lib-dynamodb");
/** Thin wrapper to provide better type inference for our fake DDB command fns. */
const fakeDdbCommandFn = (fn) => fn;
const DynamoDBDocumentClient = {
    from: vi.fn(() => mockClient(_DynamoDBDocumentClient)
        .on(GetCommand)
        .callsFake(fakeDdbCommandFn(() => {
        return {
            Item: MOCK_USERS.USER_A,
        };
    }))
        .on(BatchGetCommand)
        .callsFake(fakeDdbCommandFn(({ RequestItems }) => {
        const [tableName] = Object.entries(RequestItems)[0];
        return {
            Responses: {
                [tableName]: Object.values(MOCK_USERS),
            },
        };
    }))
        .on(PutCommand)
        .callsFake(fakeDdbCommandFn(({ Item: { pk, sk, ...item } }) => {
        return {
            Attributes: {
                ...MOCK_USERS.USER_A,
                ...item,
            },
        };
    }))
        .on(BatchWriteCommand)
        .callsFake(fakeDdbCommandFn(() => {
        // BatchWrite doesn't return items/attributes unless they're "unprocessed".
        return {};
    }))
        .on(UpdateCommand)
        .callsFake(fakeDdbCommandFn(() => {
        console.error("UpdateCommand must be mocked individually.");
        return {
            Attributes: {},
        };
    }))
        .on(DeleteCommand)
        .callsFake(fakeDdbCommandFn(({ Key }) => {
        return {
            Attributes: MOCK_USERS.USER_A,
        };
    }))
        .on(QueryCommand)
        .callsFake(fakeDdbCommandFn(() => {
        console.warn("QueryCommand must be mocked individually.");
        return {
            Items: [],
        };
    }))
        .on(ScanCommand)
        .callsFake(fakeDdbCommandFn(() => {
        return {
            Items: Object.values(MOCK_USERS),
        };
    }))),
};
export { DynamoDBDocumentClient, GetCommand, BatchGetCommand, PutCommand, BatchWriteCommand, UpdateCommand, DeleteCommand, QueryCommand, ScanCommand, };
