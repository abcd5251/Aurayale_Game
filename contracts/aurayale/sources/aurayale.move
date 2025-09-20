module aurayale::aurayale {
    use aurayale::tokenized_asset::{Self, AssetCap, TokenizedAsset};
    use std::ascii::{String, string};
    use sui::{random::{Self, Random}, vec_map::{Self, VecMap}, vec_set::{Self, VecSet}};

    const E_UNMATCHED_LEVEL: u64 = 101;
    const E_NOT_WHITELIST: u64 = 102;

    public struct AURAYALE has drop {}

    public struct AdminCap has key, store {
        id: UID,
    }

    public struct MetadataRegistry has key, store {
        id: UID,
        asset_cap: AssetCap<AURAYALE>,
        // gemCollection -> info
        gems: VecMap<String, GemInfo>,
    }

    public struct GemInfo has copy, drop, store {
        // gem_name -> img_url
        metadatas: VecMap<String, NFTMetadata>,
        start_level: u8,
        whitelist: VecSet<address>,
    }

    public struct NFTMetadata has copy, drop, store {
        img_url: String,
        description: String,
    }

    public struct Dice has drop {
        value: u8,
    }

    fun init(witness: AURAYALE, ctx: &mut TxContext) {
        let sender = ctx.sender();
        let (asset_cap, asset_metadata) = tokenized_asset::new_asset(
            witness,
            1000,
            string(b"AUR"),
            string(b"Aurayale"),
            string(b"Aurayale is a gemstone-themed collectible card battle game"),
            option::none(),
            true,
            ctx,
        );

        transfer::public_transfer(asset_metadata, ctx.sender());

        // adminCap
        let admin_cap = AdminCap { id: object::new(ctx) };
        transfer::public_transfer(admin_cap, ctx.sender());

        // MetadataRegistry
        let mut reg = MetadataRegistry {
            asset_cap,
            id: object::new(ctx),
            gems: vec_map::empty(),
        };

        reg
            .gems
            .insert(
                string(b"red"),
                GemInfo {
                    metadatas: vec_map::empty(),
                    start_level: 0,
                    whitelist: vec_set::singleton(sender),
                },
            );
        reg
            .gems
            .insert(
                string(b"blue"),
                GemInfo {
                    metadatas: vec_map::empty(),
                    start_level: 0,
                    whitelist: vec_set::singleton(sender),
                },
            );
        reg
            .gems
            .insert(
                string(b"yellow"),
                GemInfo {
                    metadatas: vec_map::empty(),
                    start_level: 1,
                    whitelist: vec_set::singleton(sender),
                },
            );
        reg
            .gems
            .insert(
                string(b"green"),
                GemInfo {
                    metadatas: vec_map::empty(),
                    start_level: 1,
                    whitelist: vec_set::singleton(sender),
                },
            );

        transfer::public_share_object(reg);
    }

    // === Admin Function ===
    public fun add_nft_metadata(
        self: &mut MetadataRegistry,
        gem: String,
        name: String,
        img_url: String,
        description: String,
    ) {
        let info = &mut self.gems[&gem];
        info.metadatas.insert(name, NFTMetadata { img_url, description });
    }

    public fun remove_img_url(self: &mut MetadataRegistry, gem: String, name: String) {
        let info = &mut self.gems[&gem];
        info.metadatas.remove(&name);
    }

    public fun update_metadata(
        self: &mut MetadataRegistry,
        gem: String,
        name: String,
        img_url: String,
        description: String,
    ) {
        let info = &mut self.gems[&gem];
        *&mut info.metadatas[&name] =
            NFTMetadata {
                img_url,
                description,
            };
    }

    public fun add_whitelist(self: &mut MetadataRegistry, gem: String, user: address) {
        let info = &mut self.gems[&gem];
        info.whitelist.insert(user);
    }

    public fun remove_whitelist(self: &mut MetadataRegistry, gem: String, user: address) {
        let info = &mut self.gems[&gem];
        info.whitelist.remove(&user);
    }

    public fun mint(
        self: &mut MetadataRegistry,
        gem: String,
        name: String,
        ctx: &mut TxContext,
    ): TokenizedAsset<AURAYALE> {
        let gem_info = self.gems[&gem];
        assert!(gem_info.whitelist.contains(&ctx.sender()), E_NOT_WHITELIST);
        mint_(self, gem, name, ctx)
    }

    public fun admin_mint(
        self: &mut MetadataRegistry,
        _cap: &AdminCap,
        gem: String,
        name: String,
        ctx: &mut TxContext,
    ): TokenizedAsset<AURAYALE> {
        mint_(self, gem, name, ctx)
    }

    public fun burn(
        self: &mut MetadataRegistry,
        _cap: &AdminCap,
        tokenized_asset: TokenizedAsset<AURAYALE>,
        ctx: &TxContext,
    ): ID {
        let gen_name = tokenized_asset.metadata()[&string(b"name")];
        assert!(self.gems[&gen_name].whitelist.contains(&ctx.sender()), E_NOT_WHITELIST);

        let id = object::id(&tokenized_asset);
        self.asset_cap.burn(tokenized_asset);

        id
    }

    public fun admin_burn(
        self: &mut MetadataRegistry,
        _cap: &AdminCap,
        tokenized_asset: TokenizedAsset<AURAYALE>,
    ): ID {
        let id = object::id(&tokenized_asset);
        self.asset_cap.burn(tokenized_asset);

        id
    }

    entry fun roll_dice(r: &Random, ctx: &mut TxContext): Dice {
        let mut generator = random::new_generator(r, ctx);
        Dice { value: random::generate_u8(&mut generator) }
    }

    public fun merge(
        self: &mut MetadataRegistry,
        main: TokenizedAsset<AURAYALE>,
        burned: TokenizedAsset<AURAYALE>,
        dice: Dice,
        ctx: &mut TxContext,
    ): TokenizedAsset<AURAYALE> {
        abort 0
    }

    public fun merge_v1(
        self: &mut MetadataRegistry,
        r: &Random,
        main: TokenizedAsset<AURAYALE>,
        burned: TokenizedAsset<AURAYALE>,
        ctx: &mut TxContext,
    ): TokenizedAsset<AURAYALE> {
        abort 0
    }

    public fun merge_v2(
        self: &mut MetadataRegistry,
        r: &Random,
        main: TokenizedAsset<AURAYALE>,
        burned: TokenizedAsset<AURAYALE>,
        ctx: &mut TxContext,
    ) {
        let mut generator = random::new_generator(r, ctx);
        let random = random::generate_u8(&mut generator);

        let main_metadata = main.metadata();
        let main_level = parse_u8_from_bytes(main_metadata[&string(b"level")].as_bytes());

        let burned_metadata = burned.metadata();
        let burned_level = parse_u8_from_bytes(burned_metadata[&string(b"level")].as_bytes());

        assert!(burned_level == main_level, E_UNMATCHED_LEVEL);

        let gem = if (random % 2 == 0) string(b"yellow") else string(b"green");
        let gem_info = self.gems[&gem];
        let gem_metadata_keys = gem_info.metadatas.keys();
        let name_idx = random % (gem_metadata_keys.length() as u8);
        let metadata_name = gem_metadata_keys[name_idx as u64];

        self.asset_cap.burn(main);
        self.asset_cap.burn(burned);

        let keys = vector[
            string(b"gem"),
            string(b"name"),
            string(b"level"),
            string(b"description"),
        ];
        let metadata = gem_info.metadatas[&metadata_name];
        let values = vector[
            gem,
            metadata_name,
            gem_info.start_level.to_string().to_ascii(),
            metadata.description,
        ];

        let nft = self.asset_cap.mint(keys, values, 1, option::some(metadata.img_url), ctx);

        transfer::public_transfer(nft, ctx.sender());
    }

    fun mint_(
        self: &mut MetadataRegistry,
        gem: String,
        name: String,
        ctx: &mut TxContext,
    ): TokenizedAsset<AURAYALE> {
        let keys = vector[
            string(b"gem"),
            string(b"name"),
            string(b"level"),
            string(b"description"),
        ];
        let gemInfo = self.gems[&gem];
        let metadata = gemInfo.metadatas[&name];
        let values = vector[
            gem,
            name,
            gemInfo.start_level.to_string().to_ascii(),
            metadata.description,
        ];

        self.asset_cap.mint(keys, values, 1, option::some(metadata.img_url), ctx)
    }

    fun parse_u8_from_bytes(bytes: &vector<u8>): u8 {
        let mut result = 0u8;
        let mut i = 0;
        let len = bytes.length();

        while (i < len) {
            let digit = bytes[i];
            assert!(digit >= 48 && digit <= 57, 0); // Check if it's a digit (0-9)
            result = result * 10 + (digit - 48);
            i = i + 1;
        };

        result
    }

    #[test]
    fun test_parse_u8() {
        let number_str = string(b"10");

        assert!(parse_u8_from_bytes(number_str.as_bytes()) == 10);
    }
}
