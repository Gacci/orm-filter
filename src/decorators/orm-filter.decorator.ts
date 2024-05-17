import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import { generateORMFilter } from "../helpers/functions";

export const GenerateORMFilter: 
() => ParameterDecorator = createParamDecorator(
(__: string, context: ExecutionContext): any => {
    const request = context.switchToHttp()
        .getRequest();
    
    return generateORMFilter(request.query.filter); 
});