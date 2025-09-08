// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./IUniswapV2Interfaces.sol";

contract TriangularArbitrage {
    address public owner;
    address private constant UNISWAP_ROUTER_ADDRESS = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    
    IUniswapV2Router public constant uniswapRouter = IUniswapV2Router(UNISWAP_ROUTER_ADDRESS);

    event ArbitrageExecuted(address tokenA, address tokenB, address tokenC, uint amountIn, uint profit);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function executeTrade(
        address _tokenA,
        address _tokenB,
        address _tokenC,
        uint256 _amountInA
    ) external onlyOwner {
        
        IERC20 tokenA = IERC20(_tokenA);
        IERC20 tokenB = IERC20(_tokenB);
        IERC20 tokenC = IERC20(_tokenC);

        uint256 balanceABefore = tokenA.balanceOf(address(this));

        tokenA.approve(address(uniswapRouter), _amountInA);

        address[] memory path1 = new address[](2);
        path1[0] = _tokenA;
        path1[1] = _tokenB;

        uint256 amountOutB = uniswapRouter.swapExactTokensForTokens(
            _amountInA,
            0,
            path1,
            address(this),
            block.timestamp
        )[1];

        tokenB.approve(address(uniswapRouter), amountOutB);

        address[] memory path2 = new address[](2);
        path2[0] = _tokenB;
        path2[1] = _tokenC;

        uint256 amountOutC = uniswapRouter.swapExactTokensForTokens(
            amountOutB,
            0,
            path2,
            address(this),
            block.timestamp
        )[1];

        tokenC.approve(address(uniswapRouter), amountOutC);

        address[] memory path3 = new address[](2);
        path3[0] = _tokenC;
        path3[1] = _tokenA;

        uniswapRouter.swapExactTokensForTokens(
            amountOutC,
            0,
            path3,
            address(this),
            block.timestamp
        );

        uint256 balanceAAfter = tokenA.balanceOf(address(this));
        require(balanceAAfter > balanceABefore, "Trade was not profitable");
        
        uint256 profit = balanceAAfter - balanceABefore;

        emit ArbitrageExecuted(_tokenA, _tokenB, _tokenC, _amountInA, profit);
    }

    function withdraw(address _tokenAddress) external onlyOwner {
        IERC20 token = IERC20(_tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        token.transfer(owner, balance);
    }

    receive() external payable {}
}
